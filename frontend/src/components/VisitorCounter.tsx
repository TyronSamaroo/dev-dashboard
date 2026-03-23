import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

const API_BASE = "https://dev-dashboard-api.onrender.com";

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (import.meta.env.DEV) {
      return;
    }

    fetch(`${API_BASE}/api/views`, { method: "POST" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.count != null) setCount(data.count); })
      .catch(() => {
        fetch(`${API_BASE}/api/views`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => { if (data?.count != null) setCount(data.count); })
          .catch(() => {});
      });
  }, []);

  if (import.meta.env.DEV) return null;
  if (count === null) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
      <Eye size={12} />
      <span className="font-medium">{count}</span>
      <span>views</span>
    </span>
  );
}
