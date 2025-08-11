// src/shared/config/useConfig.ts
import { useEffect, useState } from "react";
import { http } from "../http/httpClient";
import type { SessionConfig } from "../../domain/types";

const DEFAULT_CFG: SessionConfig = {
  questionsPerRound: 10,
  optionsPerQuestion: 6,
  secondsPerQuestion: 15,
  multiplicandRange: [2, 9],
  multiplierRange: [2, 9],
};

export function useConfig() {
  const [cfg, setCfg] = useState<SessionConfig | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const remote = await http<SessionConfig>("/api/config");
        console.log("📦 Конфиг с бэка:", remote);
        setCfg({ ...DEFAULT_CFG, ...remote });
      } catch (e) {
        console.warn("Config error, using defaults", e);
        setErr("Работаем с настройками по умолчанию");
      }
    })();
  }, []);

  return { cfg, err };
}