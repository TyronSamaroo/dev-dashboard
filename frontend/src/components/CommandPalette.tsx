import { useState, useEffect, useRef } from "react";
import { Search, Hash, Terminal, Sun, Moon, BookOpen, Copy, Sparkles, Gamepad2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";

const API_BASE = "https://dev-dashboard-api.onrender.com";

interface PaletteItem {
  id: string;
  label: string;
  category: "section" | "api" | "action";
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isGameMode = location.pathname === "/game-on";
  const isArcadeRoute = location.pathname === "/arcade";

  const items: PaletteItem[] = [
    { id: "about", label: "About / Profile", category: "section", icon: <Hash size={14} />, action: () => { document.getElementById("about")?.scrollIntoView({ behavior: "smooth" }); onClose(); } },
    { id: "skills", label: "Stats & Skills", category: "section", icon: <Hash size={14} />, action: () => { document.getElementById("skills")?.scrollIntoView({ behavior: "smooth" }); onClose(); } },
    { id: "experience", label: "Experience", category: "section", icon: <Hash size={14} />, action: () => { document.getElementById("experience")?.scrollIntoView({ behavior: "smooth" }); onClose(); } },
    { id: "education", label: "Education", category: "section", icon: <Hash size={14} />, action: () => { document.getElementById("education")?.scrollIntoView({ behavior: "smooth" }); onClose(); } },
    { id: "projects", label: "Projects", category: "section", icon: <Hash size={14} />, action: () => { document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" }); onClose(); } },
    { id: "api-me", label: "GET /api/me", category: "api", icon: <Terminal size={14} />, action: () => { window.open(`${API_BASE}/api/me`, "_blank"); onClose(); } },
    { id: "api-projects", label: "GET /api/projects", category: "api", icon: <Terminal size={14} />, action: () => { window.open(`${API_BASE}/api/projects`, "_blank"); onClose(); } },
    { id: "api-stats", label: "GET /api/stats", category: "api", icon: <Terminal size={14} />, action: () => { window.open(`${API_BASE}/api/stats`, "_blank"); onClose(); } },
    { id: "swagger", label: "Open Swagger Docs", category: "action", icon: <BookOpen size={14} />, action: () => { window.open(`${API_BASE}/docs`, "_blank"); onClose(); } },
    { id: "mode-toggle", label: isGameMode ? "Switch to Classic View" : "Enter Overdrive", category: "action", icon: <Sparkles size={14} />, action: () => { navigate(isGameMode ? "/" : "/game-on"); onClose(); } },
    { id: "open-arcade", label: isArcadeRoute ? "Reload Arcade Tab" : "Open Arcade Tab", category: "action", icon: <Gamepad2 size={14} />, action: () => { navigate("/arcade"); onClose(); } },
    { id: "theme", label: `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`, category: "action", icon: theme === "dark" ? <Sun size={14} /> : <Moon size={14} />, action: () => { toggle(); onClose(); } },
    { id: "copy-api", label: "Copy API Base URL", category: "action", icon: <Copy size={14} />, action: () => { navigator.clipboard.writeText(API_BASE); onClose(); } },
  ];

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => { if (open) { setQuery(""); setSelected(0); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);
  useEffect(() => { setSelected(0); }, [query]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
      else if (e.key === "Enter" && filtered[selected]) { e.preventDefault(); filtered[selected].action(); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, filtered, selected, onClose]);

  if (!open) return null;

  const categoryLabels: Record<string, string> = { section: "Sections", api: "API Endpoints", action: "Actions" };
  const grouped: Record<string, PaletteItem[]> = {};
  for (const item of filtered) (grouped[item.category] ??= []).push(item);
  let runningIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] palette-backdrop bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden animate-[fadeScaleIn_0.15s_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <Search size={16} className="text-zinc-500 shrink-0" />
          <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search sections, endpoints, actions..." className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none" />
          <kbd className="text-[10px] text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800">esc</kbd>
        </div>
        <div className="max-h-64 overflow-auto py-2">
          {filtered.length === 0 && <p className="text-sm text-zinc-500 text-center py-4">No results found</p>}
          {Object.entries(grouped).map(([category, groupItems]) => (
            <div key={category}>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider px-4 py-1.5">{categoryLabels[category] ?? category}</p>
              {groupItems.map((item) => {
                const idx = runningIndex++;
                return (
                  <button key={item.id} className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${idx === selected ? "bg-violet-500/15 text-violet-300" : "text-zinc-300 hover:bg-zinc-800"}`} onClick={item.action} onMouseEnter={() => setSelected(idx)}>
                    <span className="text-zinc-500">{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 px-4 py-2 border-t border-zinc-800 text-[10px] text-zinc-500">
          <span><kbd className="px-1 py-0.5 rounded border border-zinc-700 bg-zinc-800 mr-1">↑↓</kbd>Navigate</span>
          <span><kbd className="px-1 py-0.5 rounded border border-zinc-700 bg-zinc-800 mr-1">↵</kbd>Select</span>
          <span><kbd className="px-1 py-0.5 rounded border border-zinc-700 bg-zinc-800 mr-1">esc</kbd>Close</span>
        </div>
      </div>
    </div>
  );
}
