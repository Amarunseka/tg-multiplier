// src/shared/http/sessions.ts
import { http } from "./httpClient";

export type Range = [number, number];

export type SessionStartRequest = {
  id?: null;
  startedAt: string;
  secondsPerQuestion: number;
  multiplicandRange: Range;
  multiplierRange: Range;
  questionsPerRound: number;

  appVersion?: string;
  theme?: "light" | "dark" | "unknown";
  platform?: string;
  language?: string;
  userAgent?: string;
};

export type SessionStartResponse = { id: string };

export type QuestionEvent = {
  index: number;           // 0..N-1
  a: number;
  b: number;
  correct: number;
  chosen?: number | null;  // null если не успел
  isCorrect: boolean;
  timeMs: number;
};

export type SessionFinishRequest = {
  id: string;
  finishedAt: string;
  correctCount: number;
  wrongCount: number;
  spentMs: number;
  events: QuestionEvent[];
  requestId?: string;      // для идемпотентности на бэке (если будешь поддерживать)
};

export async function startSession(payload: SessionStartRequest) {
  return http<SessionStartResponse>("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function finishSession(payload: SessionFinishRequest) {
  // важно: keepalive переживает закрытие/сворачивание
  await http<void>("/api/sessions/" + encodeURIComponent(payload.id), {
    method: "POST",
    body: JSON.stringify(payload),
    keepalive: true,
    allowNoContent: true, // бэк может ответить 204
  });
  return true;
}