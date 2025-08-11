// src/features/Timer.tsx
import { useEffect, useRef, useState } from "react";

export function Timer({
  endsAt,
  totalSeconds,
  onExpire,
}: { endsAt: number; totalSeconds: number; onExpire: () => void }) {
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
  const total = Math.max(totalSeconds, 1);
  const pct = Math.max(0, Math.min(100, Math.floor((left / (total * 1000)) * 100)));

  return (
    <div className="w-full">
      <div className="h-2 rounded bg-gray-300/50 overflow-hidden">
        <div className="h-2 bg-blue-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-center mt-2 text-sm opacity-80">{seconds} сек</div>
    </div>
  );
}