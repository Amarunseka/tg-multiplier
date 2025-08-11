// src/shared/stats.ts
import { http } from "./http/httpClient";
export function sendStats(payload: any) {
  // не ждём, просто инициируем
  http("/api/stats", { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } })
    .catch((e) => console.warn("stats failed", e));
}