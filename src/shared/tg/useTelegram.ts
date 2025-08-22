// src/shared/tg/useTelegram.ts
import WebApp from "@twa-dev/sdk";

export function initTelegram() {
  WebApp.ready();
  WebApp.expand();

  const applyTheme = () => {
    document.documentElement.dataset.theme = WebApp.colorScheme ?? "light";
  };
  applyTheme();
  WebApp.onEvent("themeChanged", applyTheme);

  return WebApp;
}

export function getInitDataPayload() {
  const w = window as unknown as { Telegram?: { WebApp?: typeof WebApp } };
  const twa = w?.Telegram?.WebApp;
  return {
    initData: twa?.initData || "",
    initDataUnsafe: twa?.initDataUnsafe || {},
  };
}

export function getClientMeta(): {
  appVersion: string;
  theme: "light" | "dark" | "unknown";
  platform: string;
  language: string;
  userAgent: string;
} {
  return {
    appVersion: "webapp-1.0.0",
    theme: (document.documentElement.dataset.theme as
      | "light"
      | "dark"
      | "unknown"
      | undefined) ?? "unknown",
    platform: navigator.platform,
    language: navigator.language,
    userAgent: navigator.userAgent,
  };
}

export const tgClose = () => WebApp.close();
export const tgBack = WebApp.BackButton;