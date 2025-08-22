// src/shared/http/httpClient.ts
export async function http<T>(
  input: RequestInfo,
  init: RequestInit & { allowNoContent?: boolean } = {}
): Promise<T> {
  const headers = new Headers(init.headers);

  // Telegram initData (из Телеги или dev-стаба)
  let initData = (window as any)?.Telegram?.WebApp?.initData;
  if (!initData) {
    try {
      const saved = localStorage.getItem("tg_initdata_dev");
      if (saved) initData = saved;
    } catch {}
  }
  if (initData) headers.set("X-Telegram-InitData", initData);

  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const res = await fetch(input, { ...init, headers });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const t = await res.text();
      if (t) msg += `: ${t}`;
    } catch {}
    throw new Error(msg);
  }

  // ✅ ВАЖНО: пустым считаем ТОЛЬКО 204 или Content-Length: 0.
  if (init.allowNoContent) {
    const cl = res.headers.get("content-length");
    if (res.status === 204 || cl === "0") {
      return undefined as T;
    }
  }

  const text = await res.text();

  if (!text) {
    // Если реально пустая строка — это тоже «без контента», но только когда разрешили
    if (init.allowNoContent) return undefined as T;
    throw new Error("Пустой ответ от сервера, а мы ждали данные");
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return JSON.parse(text) as T;
  }
  // fallback: отдать как текст
  return text as unknown as T;
}