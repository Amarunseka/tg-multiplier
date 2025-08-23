// src/features/GameScreen.tsx
import {useEffect, useRef, useState} from "react";
import {initTelegram, getClientMeta} from "../shared/tg/useTelegram";
import type {GameState} from "../domain/types";
import {Timer} from "./Timer";
import {OptionsGrid} from "./OptionsGrid";
import {FeedbackModal} from "./FeedbackModal";
import ResultScreen from "./ResultScreen";
import {startSession, finishSession} from "../shared/http/sessions";
import {fetchUser, saveUserName, type UserStats} from "../shared/http/user";
import {getConfig} from "../shared/config/api";
import WebApp from "@twa-dev/sdk";
import {Shell} from "./components/Shell";
import {NameForm} from "./components/NameForm";
import {GameController} from "../domain/GameController";

type AppStage =
    | "loadingUser"
    | "newUser"
    | "dashboard"
    | "playing"
    | "finishing"
    | "roundResult"
    | "serviceDown";

export default function GameScreen() {
    const [appStage, setAppStage] = useState<AppStage>("loadingUser");
    const [user, setUser] = useState<UserStats | null>(null);

    const [cfg, setCfg] = useState<Awaited<ReturnType<typeof getConfig>> | null>(null);
    const [state, setState] = useState<GameState>({status: "idle"});
    const controllerRef = useRef<GameController | null>(null);

    // гварды против дублей
    const userLoadedRef = useRef(false);
    const startingRef = useRef(false);
    const finishingRef = useRef(false);

    useEffect(() => {
        const tg = window?.Telegram?.WebApp;
        console.log(">>> [TG SDK]:", tg);
        console.log(">>> [initData]:", tg?.initData);
        console.log(">>> [user]:", tg?.initDataUnsafe?.user);
        console.log(">>> [theme]:", tg?.colorScheme, tg?.themeParams);
    }, []);

    useEffect(() => {
        try {
            initTelegram();
        } catch { /* ignore */
        }
    }, []);

    // 1) загружаем пользователя один раз
    useEffect(() => {
        if (userLoadedRef.current) return;
        userLoadedRef.current = true;

        (async () => {
            try {
                console.warn("[fetchUser] start");
                const u = await fetchUser();
                if (!u) {
                    // новый пользователь (200 пусто или 204)
                    setUser(null);
                    setAppStage("newUser");
                } else {
                    // существующий
                    setUser(u);
                    setAppStage("dashboard");
                }
                console.warn("[fetchUser] done", u);
            } catch (e) {
                // Любая ошибка сервиса: 4xx/5xx/сеть/невалидный JSON
                console.warn("fetchUser failed", e);
                setAppStage("serviceDown");
            }
        })();
    }, []);

    // Ошибка сервиса
    if (appStage === "serviceDown") {
        return (
            <Shell>
                <div className="max-w-lg mx-auto p-6 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md"
                     style={{ background: "rgba(14,31,26,0.9)" }}>
                    <h1 className="text-2xl font-bold mb-3">Сервис временно недоступен</h1>
                    <p className="opacity-80 mb-4">
                        Попробуй ещё раз позже. Мы сохраним прогресс, как только связь восстановится.
                    </p>
                    <button
                        className="w-full rounded-2xl py-3 text-xl font-bold text-white
                     bg-gradient-to-r from-rose-600 to-orange-600
                     hover:from-rose-500 hover:to-orange-500 active:scale-[0.98] transition"
                        onClick={async () => {
                            // Локальный retry без перезагрузки страницы
                            try {
                                const u = await fetchUser();
                                if (!u) {
                                    setUser(null);
                                    setAppStage("newUser");
                                } else {
                                    setUser(u);
                                    setAppStage("dashboard");
                                }
                            } catch (e) {
                                // остаёмся на serviceDown
                                console.warn("retry fetchUser failed", e);
                            }
                        }}
                    >
                        Попробовать ещё раз
                    </button>
                </div>
            </Shell>
        );
    }

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
        const {userName, today} = user;
        return (
            <Shell>
                <h1 className="text-2xl font-bold">Привет, {userName}!</h1>

                <div
                    className="w-full max-w-lg mx-auto rounded-3xl p-6 shadow-2xl border border-white/10 backdrop-blur-md"
                    style={{background: "rgba(14,31,26,0.9)"}}
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
                                const {id} = await startSession(payload);
                                const ctrl = new GameController(freshCfg, id, user.assignment.achievedCorrect);
                                controllerRef.current = ctrl;
                                setState(ctrl.state);
                                setAppStage("playing");
                            } catch (e) {
                                console.warn("startSession failed, continue offline", e);
                                const ctrl = new GameController(freshCfg, "offline", user.assignment.achievedCorrect);
                                controllerRef.current = ctrl;
                                setState(ctrl.state);
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
            const {a, b, options} = state.question;
            return (
                <Shell>
                    <h1 className="text-5xl font-bold text-center text-white">
                        {a} × {b} = ?
                    </h1>
                    <Timer
                        endsAt={state.endsAt}
                        totalSeconds={cfg.secondsPerQuestion}
                        onExpire={() => {
                            const ctrl = controllerRef.current;
                            if (ctrl) setState(ctrl.expire());
                        }}
                    />
                    <OptionsGrid
                        options={options}
                        onChoose={(v) => {
                            const ctrl = controllerRef.current;
                            if (ctrl) setState(ctrl.choose(v));
                        }}
                    />
                </Shell>
            );
        }

        if (state.status === "feedback") {
            const {question, isCorrect} = state;
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
                        onNext={() => {
                            const ctrl = controllerRef.current;
                            if (ctrl) setState(ctrl.next());
                        }}
                    />
                </Shell>
            );
        }

        if (state.status === "finished" && controllerRef.current?.sessionId) {
            setAppStage("finishing");
        }

        return <Shell>Идёт игра…</Shell>;
    }

    // Финиш — надёжная отправка + подтверждение от бэка
    if (appStage === "finishing" && state.status === "finished" && controllerRef.current?.sessionId) {
        if (!finishingRef.current) {
            finishingRef.current = true;

            // просим Телеграм не закрывать приложение, пока сохраняем
            try {
                WebApp.enableClosingConfirmation?.();
            } catch { /* ignore */
            }

            (async () => {
                const ctrl = controllerRef.current!;
                try {
                    const expectedDelta = state.correct;
                    const prevAchieved = ctrl.prevAchieved ?? 0;
                    let updated: UserStats | null = null;

                    // 1) отправка финиша (keepalive установлен в sessions.ts)
                    if (ctrl.sessionId !== "offline") {
                        await finishSession({
                            id: ctrl.sessionId,
                            finishedAt: new Date().toISOString(),
                            correctCount: state.correct,
                            wrongCount: state.total - state.correct,
                            spentMs: state.spentMs,
                            events: ctrl.events ?? [],
                            requestId: ctrl.finishRequestId,
                        });
                    }

                    // 2) Подтверждение: ждём, пока achievedCorrect вырастет на expectedDelta
                    // если оффлайн — сразу пропускаем проверку
                    if (ctrl.sessionId !== "offline") {
                        let attempt = 0;
                        const maxDelay = 5000;
                        const hardTimeoutMs = 20000; // максимум 20с ждём бэк
                        const startedAt = Date.now();

                        while (true) {
                            attempt++;
                            try {
                                const fresh = await fetchUser();
                                if (fresh) {
                                    const now = fresh.assignment.achievedCorrect;
                                    if (now >= prevAchieved + expectedDelta) {
                                        updated = fresh;
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

                    // 3) если бэк не подтвердил — обновляем статы локально
                    if (!updated && user) {
                        updated = {
                            ...user,
                            today: {
                                ...user.today,
                                total: user.today.total + state.total,
                                correct: user.today.correct + state.correct,
                                wrong: user.today.wrong + (state.total - state.correct),
                            },
                            assignment: {
                                ...user.assignment,
                                achievedCorrect: prevAchieved + expectedDelta,
                            },
                        };
                    }

                    if (updated) setUser(updated);
                } finally {
                    try {
                        WebApp.disableClosingConfirmation?.();
                    } catch { /* ignore */
                    }
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
        const achieved = (controllerRef.current?.prevAchieved ?? user.assignment.achievedCorrect) + state.correct;
        const left = Math.max(0, user.assignment.targetCorrect - achieved);
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
                            const {id} = await startSession(payload);
                            const ctrl = new GameController(freshCfg, id, user.assignment.achievedCorrect);
                            controllerRef.current = ctrl;
                            setState(ctrl.state);
                            setAppStage("playing");
                        } catch (e) {
                            console.warn("startSession failed, continue offline", e);
                            const ctrl = new GameController(freshCfg, "offline", user.assignment.achievedCorrect);
                            controllerRef.current = ctrl;
                            setState(ctrl.state);
                            setAppStage("playing");
                        } finally {
                            startingRef.current = false;
                        }
                    }}
                    onMenu={() => {
                        setState({status: "idle"});
                        controllerRef.current = null;
                        setCfg(null);
                        setAppStage("dashboard");
                    }}
                />
            </Shell>
        );
    }

    return <Shell>Загрузка…</Shell>;
}
