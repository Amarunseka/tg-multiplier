// src/features/OptionsGrid.tsx
export function OptionsGrid({
  options,
  onChoose,
}: {
  options: number[];
  onChoose: (v: number) => void;
}) {
  // строим адаптивную сетку от количества
  const cols = Math.ceil(Math.sqrt(options.length));
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChoose(o)}
          className="rounded-xl py-4 text-lg font-semibold shadow border active:scale-[0.98] transition"
          aria-label={`Ответ ${o}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
