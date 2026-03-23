import { useEffect, useState, useRef } from "react";
import { Copy, Check, ChevronUp } from "lucide-react";
import { highlightJson } from "../utils/jsonHighlight";

const API_BASE = "https://dev-dashboard-api.onrender.com";

interface TryItPanelProps {
  path: string;
  onClose: () => void;
}

export default function TryItPanel({ path, onClose }: TryItPanelProps) {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const cache = useRef<Record<string, unknown>>({});

  useEffect(() => {
    if (cache.current[path]) {
      setData(cache.current[path]);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}${path}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((json) => {
        if (!mounted) return;
        cache.current[path] = json;
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message);
        setLoading(false);
      });

    return () => { mounted = false; };
  }, [path]);

  const handleCopy = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mt-1 rounded-lg border border-zinc-700/50 bg-zinc-900/80 overflow-hidden animate-[fadeScaleIn_0.2s_ease-out]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800/50 border-b border-zinc-700/50">
        <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Response · {path}</span>
        <div className="flex items-center gap-1">
          <button onClick={handleCopy} className="p-1 rounded hover:bg-zinc-600/50 transition-colors" title="Copy response">
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-zinc-500" />}
          </button>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-600/50 transition-colors" title="Collapse">
            <ChevronUp size={12} className="text-zinc-500" />
          </button>
        </div>
      </div>
      <div className="px-3 py-2 max-h-64 overflow-auto">
        {loading && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <div className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" />
            Fetching...
          </div>
        )}
        {error && <p className="text-xs text-red-400 font-mono">Error: {error}</p>}
        {!loading && !error && data !== null && (
          <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-words">{highlightJson(data)}</pre>
        )}
      </div>
    </div>
  );
}
