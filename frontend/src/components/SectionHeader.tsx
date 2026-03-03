import type { ElementType } from "react";

interface SectionHeaderProps {
  icon: ElementType;
  title: string;
  count?: number;
}

export default function SectionHeader({ icon: Icon, title, count }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={20} className="text-violet-400" />
      <h2 className="text-lg font-semibold">{title}</h2>
      {count !== undefined && (
        <span className="text-sm text-zinc-500">({count})</span>
      )}
    </div>
  );
}
