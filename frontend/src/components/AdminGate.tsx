import { useState, type ReactNode, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { getAdminKey, setAdminKey } from "../api";

export default function AdminGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => !!getAdminKey());
  const [key, setKey] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError(true);
      return;
    }
    setAdminKey(trimmed);
    setError(false);
    setUnlocked(true);
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 w-full max-w-sm space-y-5 shadow-xl"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="bg-violet-500/10 p-3 rounded-full">
            <Lock size={24} className="text-violet-400" />
          </div>
          <h2 className="text-lg font-semibold">Admin Access</h2>
          <p className="text-sm text-zinc-400 text-center">
            Enter your admin key to manage your dashboard.
          </p>
        </div>

        <div>
          <input
            type="password"
            placeholder="Admin key"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setError(false);
            }}
            className={`w-full px-3 py-2 rounded-md bg-zinc-800 border text-sm outline-none transition-colors
              ${error ? "border-red-500 focus:border-red-400" : "border-zinc-700 focus:border-violet-500"}`}
            autoFocus
          />
          {error && (
            <p className="text-red-400 text-xs mt-1.5">Please enter a key.</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-2 rounded-md bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-colors"
        >
          Unlock
        </button>
      </form>
    </div>
  );
}
