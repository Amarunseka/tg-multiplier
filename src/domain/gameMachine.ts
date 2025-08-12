import type { SessionConfig } from "./types";

export type Question = {
  a: number;
  b: number;
  correct: number;
  options: number[];
};

export type AskingState = {
  status: "asking";
  index: number;        // 0..N-1
  question: Question;
  endsAt: number;       // deadline (performance.now() + seconds*1000)
};

export type FeedbackState = {
  status: "feedback";
  index: number;
  question: Question;
  isCorrect: boolean;
};

export type FinishedState = {
  status: "finished";
  total: number;
  correct: number;
  spentMs: number;
};

export type IdleState = { status: "idle" };

export type GameState = IdleState | AskingState | FeedbackState | FinishedState;

export type QuestionEvent = {
  index: number;
  a: number;
  b: number;
  correct: number;
  chosen: number | null;
  isCorrect: boolean;
  timeMs: number;
};

export type GameCtx = {
  cfg: SessionConfig;
  sessionId: string;
  events: QuestionEvent[];
  roundStartedAt: number;      // performance.now()
  qStartedAt: number;          // start time of current question
  answerLockedForIndex: number; // -1 если ещё не зафиксирован ответ для текущего вопроса
};

// ===== генерация =====

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeQuestion(cfg: SessionConfig): Question {
  const a = randInt(cfg.multiplicandRange[0], cfg.multiplicandRange[1]);
  const b = randInt(cfg.multiplierRange[0], cfg.multiplierRange[1]);
  const correct = a * b;

  const set = new Set<number>([correct]);
  while (set.size < cfg.optionsPerQuestion) {
    const delta = randInt(-3, 3) || 1;
    const v = correct + delta * randInt(1, 3);
    if (v > 0) set.add(v);
  }

  const options = Array.from(set);
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return { a, b, correct, options };
}

function makeAsking(index: number, ctx: GameCtx): AskingState {
  const q = makeQuestion(ctx.cfg);
  const now = performance.now();
  ctx.qStartedAt = now;
  ctx.answerLockedForIndex = -1; // сбросить lock для нового вопроса
  return {
    status: "asking",
    index,
    question: q,
    endsAt: now + ctx.cfg.secondsPerQuestion * 1000,
  };
}

// ===== публичный API =====

export function startGameWithSession(cfg: SessionConfig, sessionId: string): { state: GameState; ctx: GameCtx } {
  const ctx: GameCtx = {
    cfg,
    sessionId,
    events: [],
    roundStartedAt: performance.now(),
    qStartedAt: performance.now(),
    answerLockedForIndex: -1,
  };
  const state = makeAsking(0, ctx);
  return { state, ctx };
}

/** Зафиксировать ответ по клику. Пишет событие ровно один раз. */
export function choose(state: GameState, ctx: GameCtx, value: number): GameState {
  if (state.status !== "asking") return state;
  // если уже кто-то (клик или таймер) зафиксировал ответ — игнор
  if (ctx.answerLockedForIndex === state.index) {
    return {
      status: "feedback",
      index: state.index,
      question: state.question,
      isCorrect: ctx.events[ctx.events.length - 1]?.isCorrect ?? false,
    };
  }

  const now = performance.now();
  const elapsed = Math.max(0, Math.min(now - ctx.qStartedAt, ctx.cfg.secondsPerQuestion * 1000));
  const chosen = Number(value);
  const isCorrect = chosen === state.question.correct;

  ctx.events.push({
    index: state.index,
    a: state.question.a,
    b: state.question.b,
    correct: state.question.correct,
    chosen,
    isCorrect,
    timeMs: Math.round(elapsed),
  });
  ctx.answerLockedForIndex = state.index;

  return {
    status: "feedback",
    index: state.index,
    question: state.question,
    isCorrect,
  };
}

/** Истечение таймера. Пишет событие только если ещё не было клика. */
export function expire(state: GameState, ctx: GameCtx): GameState {
  if (state.status !== "asking") return state;
  if (ctx.answerLockedForIndex === state.index) {
    // уже зафиксировано кликом — просто показываем фидбэк с тем же результатом
    const last = ctx.events[ctx.events.length - 1];
    return {
      status: "feedback",
      index: state.index,
      question: state.question,
      isCorrect: last?.isCorrect ?? false,
    };
  }

  const now = performance.now();
  const elapsed = Math.max(0, Math.min(now - ctx.qStartedAt, ctx.cfg.secondsPerQuestion * 1000));

  ctx.events.push({
    index: state.index,
    a: state.question.a,
    b: state.question.b,
    correct: state.question.correct,
    chosen: null,
    isCorrect: false,
    timeMs: Math.round(elapsed),
  });
  ctx.answerLockedForIndex = state.index;

  return {
    status: "feedback",
    index: state.index,
    question: state.question,
    isCorrect: false,
  };
}

/** Следующий вопрос или финиш. */
export function next(state: GameState, ctx: GameCtx): GameState {
  if (state.status !== "feedback") return state;

  const nextIndex = state.index + 1;
  if (nextIndex >= ctx.cfg.questionsPerRound) {
    const total = ctx.cfg.questionsPerRound;
    const correct = ctx.events.reduce((acc, e) => acc + (e.isCorrect ? 1 : 0), 0);
    const spentMs = Math.round(performance.now() - ctx.roundStartedAt);
    return { status: "finished", total, correct, spentMs };
  }

  return makeAsking(nextIndex, ctx);
}