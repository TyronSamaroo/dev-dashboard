import { useEffect, useRef, useState } from "react";

const levelMap: Record<string, number> = {
  certified: 95,
  advanced: 90,
  proficient: 75,
  intermediate: 60,
  familiar: 45,
  beginner: 25,
};

function getPercentage(value: string): number {
  const lower = value.toLowerCase();
  if (levelMap[lower] !== undefined) return levelMap[lower];
  const num = parseInt(value, 10);
  if (!isNaN(num)) return Math.min(num * 10, 100);
  return 70;
}

interface SkillBarProps {
  label: string;
  value: string;
  color?: string;
}

export default function SkillBar({ label, value, color = "bg-violet-500" }: SkillBarProps) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);
  const pct = getPercentage(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          requestAnimationFrame(() => setWidth(pct));
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pct]);

  return (
    <div ref={ref} className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className="font-medium text-xs text-zinc-500">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div className={`h-full rounded-full skill-bar-fill ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
