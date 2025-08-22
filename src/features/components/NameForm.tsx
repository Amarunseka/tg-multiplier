import { useState } from "react";

export function NameForm({
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
