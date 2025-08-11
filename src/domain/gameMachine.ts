import { makeQuestion } from "./generator";
import type { GameState, SessionConfig } from "./types";
import type { QuestionEvent } from "./types";

export type GameCtx = {
  cfg: SessionConfig;
  startedAt: number;
  correctCount: number;
  spentMs: number;
  sessionId: string;          // получаем от бэка
  events: QuestionEvent[];     // копим события
};

export function startGameWithSession(cfg: SessionConfig, sessionId: string): { state: GameState; ctx: GameCtx } {
  const q = makeQuestion(cfg);
  const now = performance.now();
  return {
    state: {
      status: "asking",
      index: 0,
      question: q,
      endsAt: now + cfg.secondsPerQuestion * 1000,
      answered: false,
      // запомним, когда начался текущий вопрос
      // (добавим поле на лету через приведённый тип)
    } as any,
    ctx: { cfg, startedAt: now, correctCount: 0, spentMs: 0, sessionId, events: [] },
  };
}

// helper: время на вопрос
function timeForCurrent(endsAt: number, cfg: SessionConfig): number {
  const total = cfg.secondsPerQuestion * 1000;
  // грубо: если отвечено раньше, вычислим в choose/expire точнее
  return total;
}

// Вариант без ctx в сигнатуре оставим только там, где ctx не нужен
export function choose(state: GameState, ctx: GameCtx, value: number): GameState {
  if (state.status !== "asking" || state.answered) return state;
  const now = performance.now();
  const isCorrect = value === state.question.correct;
  state.answered = true;
  if (isCorrect) ctx.correctCount++;

  const timeMs = Math.max(0, (state.endsAt - ctx.cfg.secondsPerQuestion * 1000) ? now - (state.endsAt - ctx.cfg.secondsPerQuestion * 1000) : ctx.cfg.secondsPerQuestion * 1000);
  ctx.events.push({
    index: state.index,
    a: state.question.a,
    b: state.question.b,
    correct: state.question.correct,
    chosen: value,
    isCorrect,
    timeMs,
  });

  return {
    status: "feedback",
    index: state.index,
    question: state.question,
    isCorrect,
    chosen: value,
  };
}

export function expire(state: GameState, ctx: GameCtx): GameState {
  if (state.status !== "asking" || state.answered) return state;
  state.answered = true;

  // Не успел — chosen нет, isCorrect = false, время = полный лимит
  ctx.events.push({
    index: state.index,
    a: state.question.a,
    b: state.question.b,
    correct: state.question.correct,
    chosen: null,
    isCorrect: false,
    timeMs: ctx.cfg.secondsPerQuestion * 1000,
  });

  return {
    status: "feedback",
    index: state.index,
    question: state.question,
    isCorrect: false,
  };
}

export function next(state: GameState, ctx: GameCtx): GameState {
  if (state.status !== "feedback") return state;
  const nextIndex = state.index + 1;
  if (nextIndex >= ctx.cfg.questionsPerRound) {
    const total = ctx.cfg.questionsPerRound;
    const spentMs = performance.now() - ctx.startedAt;
    return { status: "finished", correct: ctx.correctCount, total, spentMs };
  }
  const q = makeQuestion(ctx.cfg);
  const now = performance.now();
  return {
    status: "asking",
    index: nextIndex,
    question: q,
    endsAt: now + ctx.cfg.secondsPerQuestion * 1000,
    answered: false,
  };
}