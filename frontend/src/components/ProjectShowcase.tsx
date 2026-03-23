import { useState, useCallback, type MouseEvent } from "react";
import {
  Github,
  ExternalLink,
  Code2,
} from "lucide-react";
import type { Project } from "../types";
import { useScrollReveal } from "../hooks/useScrollReveal";

const statusColors: Record<string, { bg: string; dot: string; bar: string }> = {
  active: {
    bg: "bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400",
    bar: "status-bar-active",
  },
  completed: {
    bg: "bg-blue-500/10 text-blue-400",
    dot: "bg-blue-400",
    bar: "status-bar-completed",
  },
  archived: {
    bg: "bg-zinc-500/10 text-zinc-400",
    dot: "bg-zinc-500",
    bar: "status-bar-archived",
  },
};

/* ─── Project Card with 3D Tilt ─── */
function ProjectCard3D({ project, index }: { project: Project; index: number }) {
  const { ref, style } = useScrollReveal({ variant: "scale-in", delay: index * 100 });
  const sc = statusColors[project.status] ?? statusColors.active;
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -8, y: x * 8 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  return (
    <div
      ref={ref}
      style={{
        ...style,
        transform: `${style.transform ?? ""} perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="project-card-3d rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden"
    >
      {/* Status accent bar */}
      <div className={`h-0.5 ${sc.bar}`} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-lg">{project.name}</h3>
          <span
            className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${sc.bg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
            {project.status}
          </span>
        </div>

        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
          {project.description}
        </p>

        {/* date removed — not useful */}

        {/* Tech stack */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {project.tech_stack.map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 text-xs rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700/50"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Links */}
        <div className="project-links flex gap-3 mt-4 pt-3 border-t border-zinc-800">
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <Github size={14} /> Source
            </a>
          )}
          {project.live_url && (
            <a
              href={project.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <ExternalLink size={14} /> Live
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ Main ProjectShowcase ═══ */
export default function ProjectShowcase({ projects }: { projects: Project[] }) {
  return (
    <section id="projects">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Code2 size={20} className="text-violet-400" />
        <h2 className="text-xl font-semibold">Projects</h2>
        <span className="text-sm text-zinc-500">{projects.length}</span>
      </div>

      {/* All projects in a grid — no filters, just scroll reveals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project, i) => (
          <ProjectCard3D key={project.id} project={project} index={i} />
        ))}
      </div>
    </section>
  );
}
