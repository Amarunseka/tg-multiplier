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
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 bg-black/300 flex items-start justify-center pt-20 px-4" // было items-center; добавили pt-20
    >
      <div
        className="w-full max-w-md rounded-3xl p-6 shadow-2xl border border-white/10 backdrop-blur-md"
        style={{ background: "rgba(14,31,26,0.9)" }}
      >
        <div className={`text-2xl font-extrabold ${isCorrect ? "text-emerald-300" : "text-rose-300"}`}>
          {isCorrect ? "Правильно! 🎉" : "Неправильно 😕"}
        </div>
        {!isCorrect && (
          <div className="mt-2 text-white/90 text-lg">
            Правильный ответ: <b className="text-sky-200 text-xl">{correct}</b>
          </div>
        )}
        <button
          className="mt-5 w-full rounded-2xl py-3 text-xl font-bold text-white
                    bg-gradient-to-r from-sky-700 to-indigo-700
                    hover:from-sky-600 hover:to-indigo-600 active:scale-[0.98] transition"
                     onClick={onNext}
        >
          Далее
        </button>
      </div>
    </div>
  );
}