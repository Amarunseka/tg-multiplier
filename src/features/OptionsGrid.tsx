import React from "react";

export function OptionsGrid({
  options,
  onChoose,
}: {
  options: number[];
  onChoose: (v: number) => void;
}) {
  // 3 колонки под 6 вариантов; на будущее можно сделать адаптив
  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChoose(o)}
          className="rounded-2xl py-4 text-2xl font-extrabold text-white
                     shadow-lg border border-white/10 active:scale-[0.98] transition-all
                     bg-gradient-to-r from-sky-500 to-indigo-500
                     hover:from-sky-400 hover:to-indigo-400"
          aria-label={`Ответ ${o}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}