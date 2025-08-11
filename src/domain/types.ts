// src/domain/types.ts
export type SessionConfig = {
  questionsPerRound: number;
  optionsPerQuestion: number;
  secondsPerQuestion: number;
  multiplicandRange: [number, number];
  multiplierRange: [number, number];
};

export type Question = {
  a: number;
  b: number;
  correct: number;
  options: number[];
};

export type AskingState = {
  status: "asking";
  index: number;        // номер текущего вопроса
  question: Question;
  endsAt: number;       // deadline в ms (performance.now())
  answered?: boolean;   // guard от двойных кликов/таймера
};

export type FeedbackState = {
  status: "feedback";
  index: number;
  question: Question;
  isCorrect: boolean;
  chosen?: number | null;
};

export type FinishedState = {
  status: "finished";
  total: number;
  correct: number;
  spentMs: number;
};

export type IdleState = { status: "idle" };

export type GameState = IdleState | AskingState | FeedbackState | FinishedState;