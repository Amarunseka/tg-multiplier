// src/features/ResultScreen.tsx
export function ResultScreen({
  correct,
  total,
  spentMs,
  onRestart,
  onExit,
}: {
  correct: number;
  total: number;
  spentMs: number;
  onRestart: () => void;
  onExit: () => void;
}) {
  const sec = Math.round(spentMs / 1000);
  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Результат</h2>
      <div className="text-lg">Правильных: <b>{correct}</b> из {total}</div>
      <div className="opacity-80">Время: {sec} сек</div>
      <div className="flex gap-3">
        <button className="flex-1 rounded-xl py-3 bg-blue-600 text-white" onClick={onRestart}>Пройти ещё раз</button>
        <button className="flex-1 rounded-xl py-3 border" onClick={onExit}>Выйти</button>
      </div>
    </div>
  );
}