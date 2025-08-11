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
  options: number[]; // длина = optionsPerQuestion, перемешаны
};

export type GameState =
  | { status: "idle" }
  | {
      status: "asking";
      index: number;            // номер вопроса [0..N-1]
      question: Question;
      endsAt: number;           // performance.now() + secs*1000
      answered: boolean;        // защита от гонок
    }
  | {
      status: "feedback";
      index: number;
      question: Question;
      isCorrect: boolean;
      chosen?: number;
    }
  | {
      status: "finished";
      correct: number;
      total: number;
      spentMs: number;
    };