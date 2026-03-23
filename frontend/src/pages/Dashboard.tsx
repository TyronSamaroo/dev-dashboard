import { useRef } from "react";
import {
  Github,
  Linkedin,
  Mail,
  Code2,
  BarChart3,
  Wrench,
  Layers,
  Activity,
  Zap,
  Award,
  ArrowDown,
} from "lucide-react";
import type { Stat } from "../types";
import SectionHeader from "../components/SectionHeader";
import ExperienceTimeline from "../components/ExperienceTimeline";
import EducationSection from "../components/EducationSection";
import ProjectShowcase from "../components/ProjectShowcase";
import { workExperience, education, certifications } from "../data/resume";
import { profile as staticProfile, projects as staticProjects, stats as staticStats } from "../data/static";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { useScrollProgress } from "../hooks/useScrollProgress";
import { useCountUp } from "../hooks/useCountUp";

const categoryIcons: Record<string, React.ReactNode> = {
  language: <Code2 size={14} />,
  framework: <Layers size={14} />,
  tool: <Wrench size={14} />,
  metric: <Activity size={14} />,
};

const categoryColors: Record<string, string> = {
  language: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  framework: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  tool: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  metric: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

/* ─── Stat Card with scale-in ─── */
function StatCard({
  category,
  items,
  index,
}: {
  category: string;
  items: Stat[];
  index: number;
}) {
  const { ref, style } = useScrollReveal({ variant: "scale-in", delay: index * 80 });
  return (
    <div
      ref={ref}
      style={style}
      className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-colors"
    >
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border mb-3 ${categoryColors[category] ?? ""}`}
      >
        {categoryIcons[category]}
        {category.charAt(0).toUpperCase() + category.slice(1)}s
      </div>
      <div className="space-y-2">
        {items.map((stat) => (
          <div key={stat.id} className="flex justify-between text-sm">
            <span className="text-zinc-400">{stat.label}</span>
            <span className="font-medium">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Animated Metric Card ─── */
function MetricCard({
  value,
  label,
  icon: Icon,
  delay,
}: {
  value: string;
  label: string;
  icon: React.ElementType;
  delay: number;
}) {
  // Parse leading number for count-up (e.g. "3+" → 3, "6+" → 6)
  const numMatch = value.match(/^(\d+)/);
  const target = numMatch ? parseInt(numMatch[1], 10) : 0;
  const suffix = numMatch ? value.slice(numMatch[1].length) : "";
  const hasNumber = target > 0;

  const { ref, value: count } = useCountUp(target, { duration: 1500, delay });

  return (
    <div
      ref={hasNumber ? ref : undefined}
      className="hero-metric rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex flex-col gap-2"
    >
      <Icon size={16} className="text-violet-400" />
      <div className="text-2xl font-bold counter-number">
        {hasNumber ? `${count}${suffix}` : value}
      </div>
      <div className="text-[11px] text-zinc-500 uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}

/* ─── Scroll Divider ─── */
function ScrollDivider() {
  const { ref, clampedProgress } = useScrollProgress();
  const width = clampedProgress(0.2, 0.8);

  return (
    <div ref={ref} className="py-2">
      <div
        className="scroll-divider"
        style={{ transform: `scaleX(${width})` }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════ */
export default function Dashboard() {
  // Static data — loads instantly, no backend needed
  const projects = staticProjects;
  const stats = staticStats;

  // Parallax for hero
  const { ref: heroRef, progress: heroProgress } = useScrollProgress();

  // Scale-in for API docs
  const { ref: apiRef, style: apiStyle } = useScrollReveal({ variant: "scale-in" });

  // Scroll anchor ref
  const contentRef = useRef<HTMLDivElement>(null);

  const grouped = stats.reduce(
    (acc, s) => {
      (acc[s.category] ??= []).push(s);
      return acc;
    },
    {} as Record<string, Stat[]>
  );

  // Hero parallax — gentle shift only, no opacity fade
  const heroShift = Math.max(0, heroProgress - 0.15) * 30;

  // Parallax orbs at different rates
  const orb1Shift = heroProgress * 60;
  const orb2Shift = heroProgress * 35;

  return (
    <div className="space-y-12">
      {/* ═══ ABOUT ME HERO — Staggered Apple-style Reveal ═══ */}
      <section id="about" ref={heroRef} className="relative min-h-[85vh] flex flex-col justify-center py-12 overflow-hidden">
        {/* Background gradient orbs with parallax */}
        <div
          className="parallax-orb absolute top-1/4 -left-32 w-96 h-96 bg-violet-500/8 rounded-full blur-[120px]"
          style={{ transform: `translateY(-${orb1Shift}px)` }}
        />
        <div
          className="parallax-orb absolute bottom-1/4 -right-32 w-80 h-80 bg-blue-500/6 rounded-full blur-[100px]"
          style={{ transform: `translateY(${orb2Shift}px)` }}
        />

        <div
          style={{
            transform: `translateY(-${heroShift}px)`,
            transition: "none",
          }}
        >
          {/* Eyebrow */}
          <div className="hero-reveal hero-reveal-1 flex items-center gap-3 mb-6">
            <div className="w-10 h-px bg-violet-500/60" />
            <span className="text-xs font-medium tracking-widest uppercase text-violet-400">
              Software Engineer &middot; ML Engineer
            </span>
          </div>

          {/* Name — clip-path text reveal */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]">
            <span className="block text-clip-reveal text-clip-reveal-1">Tyron</span>
            <span className="block text-clip-reveal text-clip-reveal-2 bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              Samaroo
            </span>
          </h1>

          {/* Bio */}
          <p className="hero-reveal hero-reveal-3 text-lg md:text-xl text-zinc-400 mt-6 max-w-2xl leading-relaxed">
            {staticProfile.bio}
          </p>

          {/* Metric cards with count-up animation */}
          <div className="hero-reveal hero-reveal-4 grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {[
              { value: "6+", label: "Years Experience", icon: Zap },
              { value: "MS", label: "Data Science", icon: Award },
              { value: "AWS", label: "Certified Dev", icon: Activity },
              { value: "8+", label: "Projects Shipped", icon: Code2 },
            ].map((m, i) => (
              <MetricCard
                key={m.label}
                value={m.value}
                label={m.label}
                icon={m.icon}
                delay={i * 200}
              />
            ))}
          </div>

          {/* Social links */}
          <div className="hero-reveal hero-reveal-5 flex flex-wrap items-center gap-4 mt-8">
            {[
              { href: "https://github.com/tyronsamaroo", icon: Github, label: "GitHub" },
              { href: "https://linkedin.com/in/tyronsamaroo", icon: Linkedin, label: "LinkedIn" },
              { href: "mailto:tyronsamaroo828@gmail.com", icon: Mail, label: "Email" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all"
              >
                <link.icon size={16} /> {link.label}
              </a>
            ))}
          </div>

          {/* Skills */}
          <div className="hero-reveal hero-reveal-6 flex flex-wrap gap-2 mt-6">
            {staticProfile.skills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 text-xs font-medium rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700"
              >
                {skill}
              </span>
            ))}
          </div>

          {/* Scroll indicator */}
          <div className="hero-reveal hero-reveal-7 flex justify-center mt-12">
            <button
              onClick={() => contentRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="flex flex-col items-center gap-2 text-zinc-600 hover:text-zinc-400 transition-colors animate-bounce"
            >
              <span className="text-[10px] uppercase tracking-widest">Scroll</span>
              <ArrowDown size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Scroll anchor for "below hero" */}
      <div ref={contentRef} />

      {/* ─── Animated scroll divider ─── */}
      <ScrollDivider />

      {/* ─── Stats Grid (Scale-in cascade) ─── */}
      {stats.length > 0 && (
        <section id="skills">
          <SectionHeader icon={BarChart3} title="Stats & Skills" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(grouped).map(([category, items], index) => (
              <StatCard key={category} category={category} items={items} index={index} />
            ))}
          </div>
        </section>
      )}

      <ScrollDivider />

      {/* ─── Experience Timeline ─── */}
      <ExperienceTimeline experience={workExperience} />

      <ScrollDivider />

      {/* ─── Education & Certifications ─── */}
      <EducationSection education={education} certifications={certifications} />

      <ScrollDivider />

      {/* ─── Projects (Apple-style Showcase) ─── */}
      {projects.length > 0 && <ProjectShowcase projects={projects} />}

      <ScrollDivider />

      {/* ─── API Docs (Scale-in) ─── */}
      <section
        ref={apiRef}
        style={apiStyle}
        className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
      >
        <h2 className="text-lg font-semibold mb-3">Public API</h2>
        <p className="text-sm text-zinc-400 mb-4">
          Access this dashboard data programmatically.
        </p>
        <div className="space-y-2">
          {[
            { method: "GET", path: "/api/me", desc: "Profile info" },
            { method: "GET", path: "/api/projects", desc: "All projects" },
            { method: "GET", path: "/api/stats", desc: "Stats & skills" },
          ].map((endpoint) => (
            <div
              key={endpoint.path}
              className="flex items-center gap-3 px-3 py-2 rounded-md bg-zinc-800/50 font-mono text-sm"
            >
              <span className="text-emerald-400 font-semibold text-xs">
                {endpoint.method}
              </span>
              <span className="text-zinc-200">{endpoint.path}</span>
              <span className="text-zinc-500 ml-auto text-xs font-sans">
                {endpoint.desc}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="text-center text-xs text-zinc-600 pb-8">
        Built with React + FastAPI + SQLite &middot; Deployed on Vercel + Render
      </footer>
    </div>
  );
}
