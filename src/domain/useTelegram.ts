// src/shared/tg/useTelegram.ts
import WebApp from "@twa-dev/sdk";

export function initTelegram() {
  WebApp.ready();
  WebApp.expand();
  document.documentElement.dataset.theme = WebApp.colorScheme ?? "light";
  WebApp.onEvent("themeChanged", () => {
    document.documentElement.dataset.theme = WebApp.colorScheme ?? "light";
  });
  return WebApp;
}

export function getInitDataRaw(): string | undefined {
  return WebApp.initDataUnsafe?.query_id ? WebApp.initData : undefined;
}

export const tgClose = () => WebApp.close();
export const tgBack = WebApp.BackButton;