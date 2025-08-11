// src/features/GameScreen.tsx
import { useEffect, useState } from "react";
import { useConfig } from "../shared/config/useConfig";
import { initTelegram, tgClose } from "../shared/tg/useTelegram";
import { startGame, choose, expire, next } from "../domain/gameMachine";
import type { GameState, SessionConfig } from "../domain/types";
import { Timer } from "./Timer";
import { OptionsGrid } from "./OptionsGrid";
import { FeedbackModal } from "./FeedbackModal";
import { ResultScreen } from "./ResultScreen";

export default function GameScreen() {
  const { cfg, err } = useConfig();
  const [state, setState] = useState<GameState>({ status: "idle" });
  const [ctx, setCtx] = useState<any>(null);

  // Все хуки объявляем без условий — порядок стабилен
  useEffect(() => {
    try { initTelegram(); } catch (e) { console.error("Telegram init failed:", e); }
  }, []);

  useEffect(() => {
    if (!cfg) return;                // ждём конфиг
    if (state.status !== "idle") return;
    const { state: s, ctx: c } = startGame(cfg);
    setState(s);
    setCtx(c);
  }, [cfg, state.status]);

  // Лоадер — после хуков
  if (!cfg) {
    return (
      <div className="p-4">
        Загрузка настроек…
        {err && <div className="text-xs opacity-70 mt-2">{err}</div>}
      </div>
    );
  }

  if (state.status === "finished") {
    return (
      <ResultScreen
        correct={state.correct}
        total={state.total}
        spentMs={state.spentMs}
        onRestart={() => {
          const fresh = startGame(cfg as SessionConfig);
          setState(fresh.state);
          setCtx(fresh.ctx);
        }}
        onExit={tgClose}
      />
    );
  }

  if (state.status === "asking") {
    const { a, b, options } = state.question;
    return (
      <div className="p-4 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">{a} × {b} = ?</h1>
        <Timer
          endsAt={state.endsAt}
          totalSeconds={cfg.secondsPerQuestion}
          onExpire={() => setState((s) => expire(s))}
        />
        <OptionsGrid
          options={options}
          onChoose={(v) => setState((s) => choose(s, ctx, v))}
        />
      </div>
    );
  }

  if (state.status === "feedback") {
    const { question, isCorrect } = state;
    return (
      <>
        <div className="p-4 flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-center">{question.a} × {question.b} = ?</h1>
        </div>
        <FeedbackModal
          isCorrect={isCorrect}
          correct={question.correct}
          onNext={() => setState((s) => next(s, ctx))}
        />
      </>
    );
  }

  return <div className="p-4">Инициализация…</div>;
}