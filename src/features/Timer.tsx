import { useEffect, useRef, useState } from "react";

export function Timer({
  endsAt,
  totalSeconds,
  onExpire,
}: {
  endsAt: number;
  totalSeconds: number;
  onExpire: () => void;
}) {
  const [left, setLeft] = useState(endsAt - performance.now());
  const fired = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      const ms = endsAt - performance.now();
      setLeft(ms);
      if (ms <= 0 && !fired.current) {
        fired.current = true;
        onExpire();
      }
    }, 50);
    return () => clearInterval(id);
  }, [endsAt, onExpire]);

  const seconds = Math.max(0, Math.ceil(left / 1000));
  const pct = Math.max(0, Math.min(100, Math.floor((left / (totalSeconds * 1000)) * 100)));

  // Цвет полосы: >66% зелёный, >33% жёлтый, иначе красный
  const barColor =
    pct > 66 ? "bg-emerald-400" : pct > 33 ? "bg-amber-400" : "bg-rose-400";

  return (
    <div className="w-full">
      <div className="h-2 rounded-full bg-white/20 overflow-hidden">
        <div
          className={`h-2 ${barColor} transition-[width] duration-100 ease-linear`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-center mt-2 text-sm text-white/90">{seconds} сек</div>
    </div>
  );
}