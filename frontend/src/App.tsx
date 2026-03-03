import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Settings, WifiOff, Wifi } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Manage from "./pages/Manage";
import AdminGate from "./components/AdminGate";
import { isBackendOnline, onBackendStatusChange, getCacheAge } from "./api";

const sectionLinks = ["About", "Skills", "Experience", "Education", "Projects"];

function formatAge(ms: number): string {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function StatusBanner() {
  const [online, setOnline] = useState(isBackendOnline());

  useEffect(() => onBackendStatusChange(setOnline), []);

  if (online) return null;

  const age = getCacheAge();
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
      <div className="max-w-6xl mx-auto flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-amber-400">
          <WifiOff size={14} />
          <span>Backend is waking up — showing cached data{age ? ` (saved ${formatAge(age)})` : ""}</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-amber-300 hover:text-amber-100 text-xs px-2 py-0.5 rounded border border-amber-500/30 hover:bg-amber-500/10 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function OnlineIndicator() {
  const [online, setOnline] = useState(isBackendOnline());
  const [showReconnect, setShowReconnect] = useState(false);

  useEffect(() => {
    return onBackendStatusChange((status) => {
      if (!online && status) setShowReconnect(true);
      setOnline(status);
    });
  }, [online]);

  useEffect(() => {
    if (showReconnect) {
      const t = setTimeout(() => setShowReconnect(false), 3000);
      return () => clearTimeout(t);
    }
  }, [showReconnect]);

  if (showReconnect) {
    return (
      <div className="flex items-center gap-1.5 text-emerald-400 text-xs animate-pulse">
        <Wifi size={12} /> Reconnected
      </div>
    );
  }
  return null;
}

export default function App() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <StatusBanner />
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-lg font-semibold tracking-tight">
              dev<span className="text-violet-400">.dashboard</span>
            </Link>
            <OnlineIndicator />
          </div>
          <div className="flex items-center gap-1">
            {/* Section anchors — visible only on home page, md+ screens */}
            {isHome && (
              <div className="hidden md:flex items-center gap-0.5 mr-2">
                {sectionLinks.map((s) => (
                  <a
                    key={s}
                    href={`#${s.toLowerCase()}`}
                    className="px-2 py-1 rounded text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
                  >
                    {s}
                  </a>
                ))}
              </div>
            )}
            <Link to="/" className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm hover:bg-zinc-800 transition-colors">
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            <Link to="/manage" className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm hover:bg-zinc-800 transition-colors">
              <Settings size={16} /> Manage
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/manage" element={<AdminGate><Manage /></AdminGate>} />
        </Routes>
      </main>
    </div>
  );
}
