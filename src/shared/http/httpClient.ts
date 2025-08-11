// src/shared/http/httpClient.ts
export async function http<T>(
  input: RequestInfo,
  init: RequestInit & { allowNoContent?: boolean } = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  const initData = (window as any)?.Telegram?.WebApp?.initData;
  if (initData) headers.set("X-Telegram-InitData", initData);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");

  const res = await fetch(input, { ...init, headers });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const t = await res.text();
      if (t) msg += `: ${t}`;
    } catch {}
    throw new Error(msg);
  }

  // <<< добавляем проверку, чтобы пустой ответ был допустим
  if (init.allowNoContent && (!res.headers.get("content-length") || res.status === 204)) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) {
    if (init.allowNoContent) {
      return undefined as T;
    }
    throw new Error("Пустой ответ от сервера, а мы ждали данные");
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return JSON.parse(text) as T;
  }
  return text as unknown as T;
}