// src/domain/generator.ts
import type { Question, SessionConfig } from "./types";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// создаём «похожие» дистракторы, чтоб не были рандомным мусором
function distractors(correct: number, need: number): number[] {
  const pool = new Set<number>();
  const deltas = [-12, -10, -9, -8, -6, -4, -3, -2, -1, 1, 2, 3, 4, 6, 8, 9, 10, 12];
  let i = 0;
  while (pool.size < need && i < 200) {
    i++;
    const d = deltas[Math.floor(Math.random() * deltas.length)];
    const v = correct + d;
    if (v > 0 && v !== correct) pool.add(v);
  }
  // если не хватило — добиваем случайными близкими
  while (pool.size < need) {
    const v = Math.max(1, correct + randInt(-15, 15));
    if (v !== correct) pool.add(v);
  }
  return Array.from(pool);
}

export function makeQuestion(cfg: SessionConfig): Question {
  const a = randInt(cfg.multiplicandRange[0], cfg.multiplicandRange[1]);
  const b = randInt(cfg.multiplierRange[0], cfg.multiplierRange[1]);
  const correct = a * b;
  const opts = [correct, ...distractors(correct, cfg.optionsPerQuestion - 1)];
  return { a, b, correct, options: shuffle(opts) };
}