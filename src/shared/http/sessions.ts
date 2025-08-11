import { http } from "../http/httpClient";

export type Range = [number, number];

export type SessionStartRequest = {
  id?: null; // по ТЗ
  startedAt: string; // ISO
  secondsPerQuestion: number;
  multiplicandRange: Range;
  multiplierRange: Range;
  questionsPerRound: number;

  // опционально — метаданные клиента
  appVersion?: string;
  theme?: "light" | "dark" | "unknown";
  platform?: string;     // "ios/android/desktop"
  language?: string;     // "ru", "en", ...
  userAgent?: string;
};

export type SessionStartResponse = {
  id: string;
};

export type QuestionEvent = {
  index: number;    // 0..N-1
  a: number;
  b: number;
  correct: number;
  chosen?: number | null; // null если не успел
  isCorrect: boolean;
  timeMs: number;   // время ответа на этот вопрос
};

export type SessionFinishRequest = {
  id: string;
  finishedAt: string; // ISO
  correctCount: number;
  wrongCount: number;
  spentMs: number;
  events: QuestionEvent[];
};

export async function startSession(payload: SessionStartRequest) {
  return http<SessionStartResponse>("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function finishSession(payload: SessionFinishRequest) {
  return http<void>("/api/sessions/" + payload.id, {
    method: "POST",
    body: JSON.stringify(payload),
    allowNoContent: true, // <- ключевая настройка
  });
}