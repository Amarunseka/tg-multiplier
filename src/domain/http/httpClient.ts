// src/shared/http/httpClient.ts
export async function http<T>(input: RequestInfo, init: RequestInit = {}): Promise<T> {

  const headers = new Headers(init.headers);
  // прикладываем initData, если есть]
  const initData = (window as any).Telegram?.WebApp?.initData;

  if (initData) headers.set("X-Telegram-InitData", initData);
  const res = await fetch(input, { ...init, headers });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}