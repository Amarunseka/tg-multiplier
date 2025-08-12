import { useEffect, useRef, useState } from "react";
import { initTelegram, getClientMeta } from "../shared/tg/useTelegram";
import { startGameWithSession, choose, expire, next } from "../domain/gameMachine";
import type { GameState } from "../domain/types";
import { Timer } from "./Timer";
import { OptionsGrid } from "./OptionsGrid";
import { FeedbackModal } from "./FeedbackModal";
import ResultScreen from "./ResultScreen";
import { startSession, finishSession } from "../shared/http/sessions";
import { fetchUser, saveUserName, type UserStats } from "../shared/http/user";
import { getConfig } from "../shared/config/api";
import WebApp from "@twa-dev/sdk";

type AppStage = "loadingUser" | "newUser" | "dashboard" | "playing" | "finishing" | "roundResult";

// маленький uuid для requestId
function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return (crypto as any).randomUUID();
  const tpl = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  return tpl.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function GameScreen() {
  const [appStage, setAppStage] = useState<AppStage>("loadingUser");
  const [user, setUser] = useState<UserStats | null>(null);

  const [cfg, setCfg] = useState<Awaited<ReturnType<typeof getConfig>> | null>(null);
  const [state, setState] = useState<GameState>({ status: "idle" });
  const [ctx, setCtx] = useState<any>(null); // sessionId, events, prevAchieved, finishRequestId

  // гварды против дублей
  const userLoadedRef = useRef(false);
  const startingRef = useRef(false);
  const finishingRef = useRef(false);

  const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-pearls" />
      <div className="relative p-4 flex flex-col gap-4 text-white">{children}</div>
    </div>
  );

  useEffect(() => {
    try { initTelegram(); } catch {}
  }, []);

  // 1) загружаем пользователя один раз
  useEffect(() => {
    if (userLoadedRef.current) return;
    userLoadedRef.current = true;
    (async () => {
      try {
        const u = await fetchUser();
        if (!u) { setUser(null); setAppStage("newUser"); }
        else { setUser(u); setAppStage("dashboard"); }
      } catch (e) {
        console.warn("fetchUser failed", e);
        setUser(null);
        setAppStage("newUser");
      }
    })();
  }, []);

  // Новый пользователь
  if (appStage === "newUser") {
    return (
      <Shell>
        <h1 className="text-3xl font-extrabold text-center">Привет! Как тебя зовут?</h1>
        <NameForm
          onSubmit={async (name, setError) => {
            await saveUserName(name);
            const u = await fetchUser();
            const savedName = u?.userName?.trim();
            if (!u || !savedName || savedName !== name.trim()) {
              setError("Что-то пошло не так. Попробуй ввести имя ещё раз.");
              return;
            }
            setUser(u);
            setAppStage("dashboard");
          }}
        />
      </Shell>
    );
  }

  // Дашборд
  if (appStage === "dashboard" && user) {
    const { userName, today } = user;
    return (
      <Shell>
        <h1 className="text-2xl font-bold">Привет, {userName}!</h1>

        <div
          className="w-full max-w-lg mx-auto rounded-3xl p-6 shadow-2xl border border-white/10 backdrop-blur-md"
          style={{ background: "rgba(14,31,26,0.9)" }}
        >
          <div className="grid grid-cols-2 gap-3 text-lg">
            <div className="opacity-80">Сегодня ты прошёл</div>
            <div className="text-right font-bold">{today.total}</div>
            <div className="opacity-80">Правильных</div>
            <div className="text-right font-bold text-emerald-300">{today.correct}</div>
            <div className="opacity-80">Ошибок</div>
            <div className="text-right font-bold text-rose-300">{today.wrong}</div>
            <div className="opacity-80">Оценка</div>
            <div className="text-right font-bold">{today.grade}</div>
            <div className="opacity-80">Задание на сегодня</div>
            <div className="text-right font-bold">
              {user.assignment.achievedCorrect} / {user.assignment.targetCorrect}
            </div>
          </div>

          <button
            className="mt-6 w-full rounded-2xl py-3 text-xl font-bold text-white
                       bg-gradient-to-r from-sky-600 to-indigo-600
                       hover:from-sky-500 hover:to-indigo-500 active:scale-[0.98] transition"
            onClick={async () => {
              if (startingRef.current) return;
              startingRef.current = true;

              const freshCfg = await getConfig();
              setCfg(freshCfg);

              const payload = {
                id: null as null,
                startedAt: new Date().toISOString(),
                secondsPerQuestion: freshCfg.secondsPerQuestion,
                multiplicandRange: freshCfg.multiplicandRange,
                multiplierRange: freshCfg.multiplierRange,
                questionsPerRound: freshCfg.questionsPerRound,
                ...getClientMeta(),
              };

              try {
                const { id } = await startSession(payload);
                const started = startGameWithSession(freshCfg, id);
                setState(started.state);
                setCtx({
                  ...started.ctx,
                  sessionId: id,
                  prevAchieved: user.assignment.achievedCorrect,
                  finishRequestId: uuid(),
                });
                setAppStage("playing");
              } catch (e) {
                console.warn("startSession failed, continue offline", e);
                const started = startGameWithSession(freshCfg, "offline");
                setState(started.state);
                setCtx({
                  ...started.ctx,
                  sessionId: "offline",
                  prevAchieved: user.assignment.achievedCorrect,
                  finishRequestId: uuid(),
                });
                setAppStage("playing");
              } finally {
                startingRef.current = false;
              }
            }}
          >
            НАЧИНАЕМ?
          </button>
        </div>
      </Shell>
    );
  }

  // Игра
  if (appStage === "playing" && cfg) {
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
            <h1 className="text-4xl md:text-5xl font-extrabold text-center text-white mb-1">
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

    if (state.status === "finished" && ctx?.sessionId) {
      setAppStage("finishing");
    }

    return <Shell>Идёт игра…</Shell>;
  }

  // Финиш — надёжная отправка + подтверждение от бэка
  if (appStage === "finishing" && state.status === "finished" && ctx?.sessionId) {
    if (!finishingRef.current) {
      finishingRef.current = true;

      // просим Телеграм не закрывать приложение, пока сохраняем
      try { WebApp.enableClosingConfirmation?.(); } catch {}

      (async () => {
        try {
          const expectedDelta = state.correct;
          const prevAchieved = ctx.prevAchieved ?? 0;

          // 1) отправка финиша (keepalive установлен в sessions.ts)
          if (ctx.sessionId !== "offline") {
            await finishSession({
              id: ctx.sessionId,
              finishedAt: new Date().toISOString(),
              correctCount: state.correct,
              wrongCount: state.total - state.correct,
              spentMs: state.spentMs,
              events: ctx.events ?? [],
              requestId: ctx.finishRequestId as string,
            });
          }

          // 2) Подтверждение: ждём, пока achievedCorrect вырастет на expectedDelta
          // если оффлайн — сразу пропускаем проверку
          if (ctx.sessionId !== "offline") {
            let attempt = 0;
            const maxDelay = 5000;
            const hardTimeoutMs = 20000; // максимум 20с ждём бэк
            const startedAt = Date.now();

            while (true) {
              attempt++;
              try {
                const updated = await fetchUser();
                if (updated) {
                  const now = updated.assignment.achievedCorrect;
                  if (now >= prevAchieved + expectedDelta) {
                    setUser(updated);
                    break;
                  }
                }
              } catch {
                // игнорим и повторяем
              }

              if (Date.now() - startedAt > hardTimeoutMs) break; // выходим по тайм‑ауту

              const delay = Math.min(800 * attempt, maxDelay);
              await new Promise(r => setTimeout(r, delay));
            }
          }
        } finally {
          try { WebApp.disableClosingConfirmation?.(); } catch {}
          setAppStage("roundResult");
          finishingRef.current = false;
        }
      })();
    }

    return (
      <Shell>
        <div className="text-base">Сохраняем результаты…</div>
      </Shell>
    );
  }

  // Экран результата круга
  if (appStage === "roundResult" && user && state.status === "finished") {
    const left = Math.max(0, user.assignment.targetCorrect - user.assignment.achievedCorrect);
    return (
      <Shell>
        <ResultScreen
          correct={state.correct}
          total={state.total}
          spentMs={state.spentMs}
          remainingCorrect={left}
          targetCorrect={user.assignment.targetCorrect}
          onRestart={async () => {
            if (startingRef.current) return;
            startingRef.current = true;

            const freshCfg = await getConfig();
            setCfg(freshCfg);

            const payload = {
              id: null as null,
              startedAt: new Date().toISOString(),
              secondsPerQuestion: freshCfg.secondsPerQuestion,
              multiplicandRange: freshCfg.multiplicandRange,
              multiplierRange: freshCfg.multiplierRange,
              questionsPerRound: freshCfg.questionsPerRound,
              ...getClientMeta(),
            };
            try {
              const { id } = await startSession(payload);
              const started = startGameWithSession(freshCfg, id);
              setState(started.state);
              setCtx({
                ...started.ctx,
                sessionId: id,
                prevAchieved: user.assignment.achievedCorrect,
                finishRequestId: uuid(),
              });
              setAppStage("playing");
            } catch (e) {
              console.warn("startSession failed, continue offline", e);
              const started = startGameWithSession(freshCfg, "offline");
              setState(started.state);
              setCtx({
                ...started.ctx,
                sessionId: "offline",
                prevAchieved: user.assignment.achievedCorrect,
                finishRequestId: uuid(),
              });
              setAppStage("playing");
            } finally {
              startingRef.current = false;
            }
          }}
          onMenu={() => {
            setState({ status: "idle" });
            setCtx(null);
            setCfg(null);
            setAppStage("dashboard");
          }}
        />
      </Shell>
    );
  }

  return <Shell>Загрузка…</Shell>;
}

/** Форма имени с показом ошибки */
function NameForm({
  onSubmit,
}: {
  onSubmit: (name: string, setError: (msg: string) => void) => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="w-full max-w-md mx-auto rounded-3xl p-6 shadow-2xl border border-white/10 backdrop-blur-md"
      style={{ background: "rgba(14,31,26,0.9)" }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim() || busy) return;
        setBusy(true);
        setError(null);
        await onSubmit(name.trim(), (msg) => setError(msg));
        setBusy(false);
      }}
    >
      <label className="block text-sm opacity-80 mb-2">Имя</label>
      <input
        className="w-full rounded-xl px-4 py-3 bg-white/10 border border-white/15 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-sky-500"
        placeholder="Введите имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {error && <div className="mt-2 text-rose-300 text-sm">{error}</div>}
      <button
        disabled={!name.trim() || busy}
        className="mt-4 w-full rounded-2xl py-3 text-xl font-bold text-white
                   bg-gradient-to-r from-sky-600 to-indigo-600
                   hover:from-sky-500 hover:to-indigo-500 active:scale-[0.98] transition disabled:opacity-50"
      >
        Сохранить
      </button>
    </form>
  );
}