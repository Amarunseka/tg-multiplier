import { useEffect, useState } from "react";
import { useConfig } from "../shared/config/useConfig";
import { initTelegram, tgClose } from "../shared/tg/useTelegram";
import { startGameWithSession, choose, expire, next } from "../domain/gameMachine";
import type { GameState, SessionConfig } from "../domain/types";
import { Timer } from "./Timer";
import { OptionsGrid } from "./OptionsGrid";
import { FeedbackModal } from "./FeedbackModal";
import { ResultScreen } from "./ResultScreen";
import { startSession, finishSession } from "../shared/http/sessions";

export default function GameScreen() {
  const { cfg, err } = useConfig();
  const [state, setState] = useState<GameState>({ status: "idle" });
  const [ctx, setCtx] = useState<any>(null);

  // Инициализация Telegram SDK — хук всегда вызывается
  useEffect(() => {
    try { initTelegram(); } catch {}
  }, []);

  // Ждём конфиг → стартуем сессию → запускаем игру
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cfg) return;
      if (state.status !== "idle") return;
      if (ctx?.sessionId) return;

      const payload = {
        id: null,
        startedAt: new Date().toISOString(),
        secondsPerQuestion: cfg.secondsPerQuestion,
        multiplicandRange: cfg.multiplicandRange,
        multiplierRange: cfg.multiplierRange,
        questionsPerRound: cfg.questionsPerRound,
        appVersion: "webapp-1.0.0",
        theme: (document.documentElement.dataset.theme as any) ?? "unknown",
        platform: navigator.platform,
        language: navigator.language,
        userAgent: navigator.userAgent,
      };

      try {
        const { id } = await startSession(payload);
        if (cancelled) return;
        const started = startGameWithSession(cfg, id);
        setState(started.state);
        setCtx(started.ctx);
      } catch (e) {
        console.warn("startSession failed, continue offline", e);
        const started = startGameWithSession(cfg, "offline");
        setState(started.state);
        setCtx(started.ctx);
      }
    })();
    return () => { cancelled = true; };
  }, [cfg, state.status, ctx?.sessionId]);

  // отправка результатов после финиша
  useEffect(() => {
    if (!ctx?.sessionId) return;
    if (state.status !== "finished") return;

    const wrong = state.total - state.correct;
    finishSession({
      id: ctx.sessionId,
      finishedAt: new Date().toISOString(),
      correctCount: state.correct,
      wrongCount: wrong,
      spentMs: state.spentMs,
      events: ctx.events ?? [],
    }).catch((e) => console.warn("finishSession failed", e));
    // зависим только от state и sessionId — ок, внутри есть guard по статусу
  }, [state, ctx?.sessionId]);

  // Единый фон и оболочка
  const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-pearls" />
      <div className="relative p-4 flex flex-col gap-4 text-white">
        {children}
      </div>
    </div>
  );

  // Лоадер (после хуков)
  if (!cfg) {
    return (
      <Shell>
        <div className="text-base">
          Загрузка настроек…
          {err && <div className="text-xs opacity-70 mt-2">{err}</div>}
        </div>
      </Shell>
    );
  }

  if (state.status === "finished") {
    return (
      <Shell>
        <ResultScreen
          correct={state.correct}
          total={state.total}
          spentMs={state.spentMs}
          onRestart={() => {
            setState({ status: "idle" }); // начнём новую сессию
            setCtx(null);
          }}
          onExit={tgClose}
        />
      </Shell>
    );
  }

  if (state.status === "asking") {
    const { a, b, options } = state.question;
    return (
      <Shell>
        <h1 className="text-5xl font-bold text-center text-white">
          {a} × {b} = ?
        </h1>
        <Timer
          endsAt={state.endsAt}
          totalSeconds={cfg.secondsPerQuestion}
          onExpire={() => setState((s) => expire(s, ctx))}
        />
        <OptionsGrid
          options={options}
          onChoose={(v) => setState((s) => choose(s, ctx, v))}
        />
      </Shell>
    );
  }

  if (state.status === "feedback") {
    const { question, isCorrect } = state;
    return (
      <Shell>
        <div className="relative p-4 flex flex-col gap-2">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center text-sky-400 mb-1">
          {question.a} × {question.b} = ?
        </h1>
        </div>
       <FeedbackModal
          isCorrect={isCorrect}
          correct={question.correct}
          onNext={() => setState((s) => next(s, ctx))}
        />
      </Shell>
    );
  }

  return <Shell>Инициализация…</Shell>;
}