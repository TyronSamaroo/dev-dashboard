import { useCallback, useState, type MouseEvent } from "react";
import { Briefcase } from "lucide-react";
import { useScrollReveal } from "../hooks/useScrollReveal";
import SectionHeader from "./SectionHeader";
import type { WorkExperience } from "../data/resume";

interface Props {
  experience: WorkExperience[];
  gameMode?: boolean;
}

function TimelineEntry({
  job,
  index,
  gameMode,
}: {
  job: WorkExperience;
  index: number;
  gameMode: boolean;
}) {
  const { ref, style, inView } = useScrollReveal({ variant: "slide-right", delay: index * 120 });
  const isCurrent = job.endDate === null;
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!gameMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -6, y: x * 6 });
    setSpotlight({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, [gameMode]);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setSpotlight({ x: 50, y: 50 });
  }, []);

  return (
    <div ref={ref} style={style} className="relative pl-10 pb-10 last:pb-0">
      {/* Dot on the timeline — pops in when card reveals */}
      <div
        className={`absolute left-[7px] top-1 w-3.5 h-3.5 rounded-full border-[3px] border-zinc-950 z-10
          ${isCurrent ? "bg-violet-400 timeline-dot-current" : "bg-zinc-600"}
          ${inView ? "dot-pop" : "opacity-0 scale-0"}`}
        style={{ animationDelay: `${index * 120 + 200}ms` }}
      />

      {/* Card */}
      <div
        onMouseMove={gameMode ? handleMouseMove : undefined}
        onMouseLeave={gameMode ? handleMouseLeave : undefined}
        className={`${gameMode ? "experience-card-3d group" : ""} relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-zinc-700`}
        style={gameMode ? { transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` } : undefined}
      >
        {gameMode && (
          <div
            className="experience-card-spotlight"
            style={{
              background: `radial-gradient(circle at ${spotlight.x}% ${spotlight.y}%, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.1) 22%, transparent 58%)`,
            }}
          />
        )}

        <div className="relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
          <div>
            <h3 className="font-semibold text-base">{job.company}</h3>
            <p className="text-sm text-violet-400">{job.role}</p>
          </div>
          <span className="text-xs text-zinc-500 whitespace-nowrap">
            {job.startDate} &ndash;{" "}
            {isCurrent ? (
              <span className="text-emerald-400 font-medium">Present</span>
            ) : (
              job.endDate
            )}
          </span>
        </div>

        {/* Bullets */}
        <ul className="space-y-2 mb-4">
          {job.bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-zinc-400 leading-relaxed">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-violet-400/50 shrink-0" />
              {bullet}
            </li>
          ))}
        </ul>

        {/* Tech tags — staggered fade */}
        <div className="flex flex-wrap gap-1.5">
          {job.techTags.map((tag, i) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded bg-violet-500/10 text-violet-300 border border-violet-500/20 transition-opacity"
              style={{
                opacity: inView ? 1 : 0,
                transitionDelay: `${index * 120 + 400 + i * 50}ms`,
                transitionDuration: "0.4s",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}

export default function ExperienceTimeline({ experience, gameMode = false }: Props) {
  return (
    <section id="experience" className="space-y-0">
      {/* Sticky section header */}
      <div className="sticky-section-header">
        <SectionHeader icon={Briefcase} title="Experience" />
      </div>

      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[13px] top-2 bottom-0 w-px bg-gradient-to-b from-violet-500/50 via-violet-500/20 to-transparent" />

        {experience.map((job, index) => (
          <TimelineEntry key={job.id} job={job} index={index} gameMode={gameMode} />
        ))}
      </div>
    </section>
  );
}
