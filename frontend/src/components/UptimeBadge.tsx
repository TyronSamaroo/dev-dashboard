import { useEffect, useState } from "react";

const API_BASE = "https://dev-dashboard-api.onrender.com";

interface PingResult {
  online: boolean;
  ms: number | null;
}

export default function UptimeBadge() {
  const [ping, setPing] = useState<PingResult>({ online: true, ms: null });

  useEffect(() => {
    let mounted = true;

    async function check() {
      const start = performance.now();
      try {
        const res = await fetch(`${API_BASE}/`, { mode: "cors" });
        if (!mounted) return;
        if (res.ok) {
          setPing({ online: true, ms: Math.round(performance.now() - start) });
        } else {
          setPing({ online: false, ms: null });
        }
      } catch {
        if (mounted) setPing({ online: false, ms: null });
      }
    }

    check();
    const id = setInterval(check, 30_000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium rounded-full border uppercase tracking-wider ${
        ping.online
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-red-500/10 text-red-400 border-red-500/20"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${ping.online ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
      {ping.online ? (ping.ms !== null ? `${ping.ms}ms` : "Live") : "Offline"}
    </span>
  );
}
