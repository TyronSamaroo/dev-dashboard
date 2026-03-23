import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Settings, WifiOff, Wifi, Sun, Moon, Sparkles, Gamepad2 } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Manage from "./pages/Manage";
import Arcade from "./pages/Arcade";
import AdminGate from "./components/AdminGate";
import CommandPalette from "./components/CommandPalette";
import { isBackendOnline, onBackendStatusChange, getCacheAge } from "./api";
import { ThemeContext, useThemeProvider, useTheme } from "./hooks/useTheme";
import { useHotkey } from "./hooks/useHotkey";

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
        <button onClick={() => window.location.reload()} className="text-amber-300 hover:text-amber-100 text-xs px-2 py-0.5 rounded border border-amber-500/30 hover:bg-amber-500/10 transition-colors">Retry</button>
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

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} className="p-2 rounded-md hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-100" title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

function AppContent() {
  const location = useLocation();
  const isGameMode = location.pathname === "/game-on";
  const isArcadeRoute = location.pathname === "/arcade";
  const isDashboardRoute = location.pathname === "/" || isGameMode;
  const isPrimaryExperience = isDashboardRoute || isArcadeRoute;
  const [paletteOpen, setPaletteOpen] = useState(false);
  const modePath = isGameMode ? "/" : "/game-on";

  useHotkey("k", () => setPaletteOpen((o) => !o));

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-100">
      <StatusBanner />
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={isGameMode ? "/game-on" : "/"} className="text-lg font-semibold tracking-tight">
              dev<span className="text-violet-400">.dashboard</span>
            </Link>
            <OnlineIndicator />
          </div>
          <div className="flex items-center gap-1">
            {isDashboardRoute && (
              <div className="hidden md:flex items-center gap-0.5 mr-2">
                {sectionLinks.map((s) => (
                  <a key={s} href={`#${s.toLowerCase()}`} className="px-2 py-1 rounded text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors">{s}</a>
                ))}
              </div>
            )}
            {isPrimaryExperience && (
              <button onClick={() => setPaletteOpen(true)} className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors border border-zinc-800">
                <kbd className="text-[10px]">⌘K</kbd>
              </button>
            )}
            {isDashboardRoute && (
              <Link
                to={modePath}
                className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm border transition-colors ${
                  isGameMode
                    ? "border-violet-500/30 bg-violet-500/12 text-violet-200 hover:bg-violet-500/18"
                    : "border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/60"
                }`}
              >
                <Sparkles size={14} />
                <span className="sm:hidden">{isGameMode ? "Classic" : "Overdrive"}</span>
                <span className="hidden sm:inline">{isGameMode ? "Classic View" : "Enter Overdrive"}</span>
              </Link>
            )}
            <Link
              to="/arcade"
              className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm border transition-colors ${
                isArcadeRoute
                  ? "border-cyan-400/35 bg-cyan-400/12 text-cyan-100 hover:bg-cyan-400/18"
                  : "border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/60"
              }`}
            >
              <Gamepad2 size={14} />
              <span>Arcade</span>
            </Link>
            {!isDashboardRoute && !isArcadeRoute && (
              <Link to="/" className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm hover:bg-zinc-800 transition-colors">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
            )}
            <ThemeToggle />
            <Link to="/manage" className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm hover:bg-zinc-800 transition-colors">
              <Settings size={16} /> Manage
            </Link>
          </div>
        </div>
      </nav>
      <main className={isArcadeRoute ? "overflow-x-hidden" : "max-w-6xl mx-auto overflow-x-hidden px-4 py-8"}>
        <Routes>
          <Route path="/" element={<Dashboard gameMode={false} />} />
          <Route path="/game-on" element={<Dashboard gameMode />} />
          <Route path="/arcade" element={<Arcade />} />
          <Route path="/manage" element={<AdminGate><Manage /></AdminGate>} />
        </Routes>
      </main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

export default function App() {
  const themeValue = useThemeProvider();
  return (
    <ThemeContext.Provider value={themeValue}>
      <AppContent />
    </ThemeContext.Provider>
  );
}
