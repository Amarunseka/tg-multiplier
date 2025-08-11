// src/features/FeedbackModal.tsx
export function FeedbackModal({
  isCorrect,
  correct,
  onNext,
}: {
  isCorrect: boolean;
  correct: number;
  onNext: () => void;
}) {
  return (
    <div role="dialog" aria-modal className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-[90%] max-w-md shadow-xl">
        <div className={`text-xl font-bold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
          {isCorrect ? "Правильно!" : "Неправильно"}
        </div>
        {!isCorrect && <div className="mt-2">Правильный ответ: <b>{correct}</b></div>}
        <button className="mt-4 w-full rounded-xl py-3 bg-blue-600 text-white" onClick={onNext}>
          Далее
        </button>
      </div>
    </div>
  );
}