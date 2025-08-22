export default function ResultScreen({
  correct,
  total,
  spentMs,
  remainingCorrect,
  targetCorrect,
  onRestart,
  onMenu,
}: {
  correct: number;
  total: number;
  spentMs: number;
  remainingCorrect: number;
  targetCorrect: number;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const seconds = Math.round(spentMs / 1000);

  return (
    <div className="w-full max-w-lg mx-auto rounded-3xl p-6 shadow-2xl border border-white/10 backdrop-blur-md text-white"
         style={{ background: "rgba(14,31,26,0.9)" }}>
      <h2 className="text-3xl font-extrabold text-center mb-4">Результаты</h2>

      <div className="grid grid-cols-2 gap-3 text-lg">
        <div className="opacity-80">Правильных</div>
        <div className="text-right font-bold">{correct} из {total}</div>

        <div className="opacity-80">Время</div>
        <div className="text-right font-bold">{seconds} сек</div>

        <div className="opacity-80">Осталось сегодня</div>
        <div className="text-right font-bold">
          {Math.max(0, remainingCorrect)} из {targetCorrect}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={onRestart}
          className="rounded-2xl py-3 text-lg font-bold text-white
                     bg-gradient-to-r from-sky-600 to-indigo-600
                     hover:from-sky-500 hover:to-indigo-500 active:scale-[0.98] transition"
        >
          Ещё раз
        </button>
        <button
          onClick={onMenu}
          className="rounded-2xl py-3 text-lg font-bold text-white
                     bg-white/10 hover:bg-white/15 border border-white/10
                     active:scale-[0.98] transition"
        >
          В меню
        </button>
      </div>
    </div>
  );
}