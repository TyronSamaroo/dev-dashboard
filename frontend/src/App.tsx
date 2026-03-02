import { Routes, Route, Link } from "react-router-dom";
import { LayoutDashboard, Settings } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Manage from "./pages/Manage";

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            dev<span className="text-violet-400">.dashboard</span>
          </Link>
          <div className="flex gap-1">
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
          <Route path="/manage" element={<Manage />} />
        </Routes>
      </main>
    </div>
  );
}
