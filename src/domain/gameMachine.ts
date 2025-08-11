// src/domain/gameMachine.ts
import { makeQuestion } from "./generator";
import type { GameState, SessionConfig } from "./types";

export type GameCtx = {
  cfg: SessionConfig;
  startedAt: number;
  correctCount: number;
  spentMs: number;
};

export function startGame(cfg: SessionConfig): { state: GameState; ctx: GameCtx } {
  const q = makeQuestion(cfg);
  const now = performance.now();
  return {
    state: {
      status: "asking",
      index: 0,
      question: q,
      endsAt: now + cfg.secondsPerQuestion * 1000,
      answered: false,
    },
    ctx: { cfg, startedAt: now, correctCount: 0, spentMs: 0 },
  };
}

export function choose(state: GameState, ctx: GameCtx, value: number): GameState {
  if (state.status !== "asking" || state.answered) return state;
  const isCorrect = value === state.question.correct;
  state.answered = true;
  if (isCorrect) ctx.correctCount++;
  return {
    status: "feedback",
    index: state.index,
    question: state.question,
    isCorrect,
    chosen: value,
  };
}

export function expire(state: GameState): GameState {
  if (state.status !== "asking" || state.answered) return state;
  state.answered = true;
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