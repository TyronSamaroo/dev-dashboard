import type { ReactNode } from "react";

export function highlightJson(value: unknown, indent = 0): ReactNode {
  const pad = "  ".repeat(indent);
  const padInner = "  ".repeat(indent + 1);

  if (value === null) return <span className="text-zinc-500">null</span>;
  if (typeof value === "boolean") return <span className="text-amber-400">{value ? "true" : "false"}</span>;
  if (typeof value === "number") return <span className="text-blue-400">{value}</span>;
  if (typeof value === "string") return <span className="text-emerald-400">"{value}"</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span>{"[]"}</span>;
    return (
      <span>
        {"[\n"}
        {value.map((item, i) => (
          <span key={i}>
            {padInner}{highlightJson(item, indent + 1)}{i < value.length - 1 ? "," : ""}{"\n"}
          </span>
        ))}
        {pad}{"]"}
      </span>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span>{"{}"}</span>;
    return (
      <span>
        {"{\n"}
        {entries.map(([key, val], i) => (
          <span key={key}>
            {padInner}<span className="text-violet-400">"{key}"</span>{": "}{highlightJson(val, indent + 1)}{i < entries.length - 1 ? "," : ""}{"\n"}
          </span>
        ))}
        {pad}{"}"}
      </span>
    );
  }

  return <span>{String(value)}</span>;
}
