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

export const tgClose = () => WebApp.close();
export const tgBack = WebApp.BackButton;