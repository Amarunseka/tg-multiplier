// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // слушать на всех интерфейсах
    allowedHosts: ["amarunseka.ru"], // 👈 разрешаем Cloudflare-домен
    proxy: {
      "/api": { target: "http://localhost:8088", changeOrigin: true },
    },
  },
});