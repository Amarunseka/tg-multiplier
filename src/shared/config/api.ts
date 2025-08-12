import { http } from "../http/httpClient";
import type { SessionConfig } from "../../domain/types";

const DEFAULT_CFG: SessionConfig = {
  questionsPerRound: 10,
  optionsPerQuestion: 6,
  secondsPerQuestion: 10,
  multiplicandRange: [2, 9],
  multiplierRange: [2, 9],
};

/** Загружаем конфиг ТОЛЬКО когда реально стартуем круг. */
export async function getConfig(): Promise<SessionConfig> {
  try {
    const remote = await http<SessionConfig>("/api/config");
    return { ...DEFAULT_CFG, ...remote };
  } catch (e) {
    console.warn("Config error, using defaults", e);
    return DEFAULT_CFG;
  }
}