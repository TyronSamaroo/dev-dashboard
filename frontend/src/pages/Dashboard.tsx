import { useEffect, useRef, useState } from "react";
import {
  Github,
  Linkedin,
  Mail,
  Code2,
  BarChart3,
  Wrench,
  Layers,
  Activity,
  Terminal,
  Copy,
  Check,
  BookOpen,
  ChevronDown,
  Zap,
  Award,
  ArrowDown,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  Target,
} from "lucide-react";
import type { Stat } from "../types";
import SectionHeader from "../components/SectionHeader";
import UptimeBadge from "../components/UptimeBadge";
import TryItPanel from "../components/TryItPanel";
import SkillBar from "../components/SkillBar";
import VisitorCounter from "../components/VisitorCounter";
import ExperienceTimeline from "../components/ExperienceTimeline";
import EducationSection from "../components/EducationSection";
import ProjectShowcase from "../components/ProjectShowcase";
import { workExperience, education, certifications } from "../data/resume";
import { profile as staticProfile, projects as staticProjects, stats as staticStats } from "../data/static";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { useScrollProgress } from "../hooks/useScrollProgress";
import { useCountUp } from "../hooks/useCountUp";
import { useMissionProgress } from "../hooks/useMissionProgress";

const API_BASE = "https://dev-dashboard-api.onrender.com";

declare global {
  interface Window {
    advanceTime?: (ms: number) => Promise<void>;
    render_game_to_text?: () => string;
  }
}

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

const barColors: Record<string, string> = {
  language: "bg-blue-500",
  framework: "bg-violet-500",
  tool: "bg-amber-500",
  metric: "bg-emerald-500",
};

const explorationMissions = [
  {
    id: "skills",
    short: "Skills",
    label: "Decode the skill matrix",
    summary: "Scan the stack map and capability spread.",
    xp: 20,
  },
  {
    id: "experience",
    short: "XP",
    label: "Trace the engineering timeline",
    summary: "Review the production and ML systems arc.",
    xp: 25,
  },
  {
    id: "education",
    short: "Edu",
    label: "Unlock the training log",
    summary: "Open the academic and certification layer.",
    xp: 15,
  },
  {
    id: "projects",
    short: "Builds",
    label: "Inspect the shipped builds",
    summary: "Browse the active and completed work vault.",
    xp: 25,
  },
  {
    id: "api",
    short: "API",
    label: "Ping the public interface",
    summary: "Open the data surface and endpoint docs.",
    xp: 30,
  },
] as const;

const signalTape = [
  "Cloud-native systems",
  "Event-driven architecture",
  "ML workflows",
  "Production reliability",
  "Developer tooling",
  "React interfaces",
  "Backend APIs",
];

const rankLabels = ["Cold Start", "Scout", "Operator", "Builder", "Architect", "Launch Ready"];

function getRankLabel(level: number) {
  return rankLabels[Math.min(Math.max(level - 1, 0), rankLabels.length - 1)];
}

/* ─── Stat Card with scale-in + skill bars ─── */
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
      <div className="space-y-3">
        {items.map((stat) => (
          <SkillBar
            key={stat.id}
            label={stat.label}
            value={stat.value}
            color={barColors[category] ?? "bg-violet-500"}
          />
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
  const numMatch = value.match(/^(\d+)/);
  const target = numMatch ? parseInt(numMatch[1], 10) : 0;
  const suffix = numMatch ? value.slice(numMatch[1].length) : "";
  const hasNumber = target > 0;

  const { ref, value: count, done } = useCountUp(target, { duration: 2500, delay });

  return (
    <div
      ref={hasNumber ? ref : undefined}
      className={`hero-metric rounded-[22px] border border-zinc-800 bg-zinc-900/50 px-4 py-4 sm:p-4 flex min-w-0 flex-col gap-2 ${done && hasNumber ? "metric-burst-active" : ""}`}
    >
      <span className="metric-flare" aria-hidden="true" />
      <Icon size={16} className="text-violet-400" />
      <div className={`text-[1.95rem] font-bold leading-none counter-number ${done && hasNumber ? "stat-highlight" : ""}`}>
        {hasNumber ? `${count}${suffix}` : value}
      </div>
      <div className="text-[10px] sm:text-[11px] text-zinc-500 uppercase tracking-[0.24em]">
        {label}
      </div>
    </div>
  );
}

function HeroNameLine({
  text,
  lineClassName,
  tone = "cool",
}: {
  text: string;
  lineClassName: string;
  tone?: "cool" | "hot";
}) {
  return (
    <span
      data-echo={text}
      className={`hero-name-shell ${tone === "hot" ? "hero-name-shell-hot" : "hero-name-shell-cool"}`}
    >
      <span
        className={`hero-name-line ${lineClassName} ${tone === "hot" ? "bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent" : "text-zinc-50"}`}
      >
        {text}
      </span>
    </span>
  );
}

function HeroOrbit({
  missions,
  visited,
  level,
  xp,
  completion,
}: {
  missions: typeof explorationMissions;
  visited: Record<string, boolean>;
  level: number;
  xp: number;
  completion: number;
}) {
  const percent = Math.round(completion * 100);

  return (
    <div className="hero-orbit-shell hidden lg:flex">
      <div className="hero-orbit-grid" />
      <div className="hero-orbit-ring hero-orbit-ring-1" />
      <div className="hero-orbit-ring hero-orbit-ring-2" />
      <div className="hero-orbit-ring hero-orbit-ring-3" />
      <div className="hero-orbit-beam" />
      <div className="hero-orbit-center">
        <span className="hero-orbit-kicker">Explorer Rank</span>
        <strong className="hero-orbit-level">{level.toString().padStart(2, "0")}</strong>
        <span className="hero-orbit-label">{getRankLabel(level)}</span>
        <div className="hero-orbit-meter">
          <span style={{ transform: `scaleX(${Math.max(completion, 0.08)})` }} />
        </div>
      </div>

      {missions.map((mission, index) => {
        const angle = (-90 + index * (360 / missions.length)) * (Math.PI / 180);
        const radius = index % 2 === 0 ? 152 : 118;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const isActive = visited[mission.id];

        return (
          <div
            key={mission.id}
            className={`hero-orbit-node ${isActive ? "is-active" : ""}`}
            style={{
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
            }}
          >
            <span className="hero-orbit-node-label">{mission.short}</span>
            <span className="hero-orbit-node-xp">+{mission.xp}</span>
          </div>
        );
      })}

      <div className="hero-orbit-footer">
        <div>
          <span>Run Sync</span>
          <strong>{percent}%</strong>
        </div>
        <div>
          <span>Session XP</span>
          <strong>{xp}</strong>
        </div>
      </div>
    </div>
  );
}

function ExplorationRun({
  missions,
  visited,
  completion,
  completedCount,
  level,
  xp,
}: {
  missions: typeof explorationMissions;
  visited: Record<string, boolean>;
  completion: number;
  completedCount: number;
  level: number;
  xp: number;
}) {
  const nextMission = missions.find((mission) => !visited[mission.id]) ?? null;
  const completionPercent = Math.round(completion * 100);

  return (
    <section className="exploration-run relative overflow-hidden rounded-[30px] border border-zinc-800/80 px-6 py-8 md:px-8 md:py-10">
      <div className="exploration-run-grid" />
      <div className="relative grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)] lg:items-start">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em] text-violet-300/90">
            <Target size={14} />
            Exploration Run
          </div>

          <h2 className="mt-4 max-w-[15ch] text-2xl font-semibold tracking-tight text-zinc-100 sm:max-w-3xl sm:text-3xl md:text-4xl">
            Complete the dashboard like a systems pass, not a passive scroll.
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
            Each major section awards XP, lights the orbit, and pushes the page toward full sync.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[
              { label: "Completion", value: `${completionPercent}%` },
              { label: "Unlocked", value: `${completedCount}/${missions.length}` },
              { label: "Rank", value: getRankLabel(level) },
              { label: "Hotkey", value: "Cmd/Ctrl + K" },
            ].map((item) => (
              <div key={item.label} className="border-l border-zinc-700/80 pl-4">
                <p className="text-[10px] uppercase tracking-[0.26em] text-zinc-500">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-zinc-100">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="exploration-track mt-8">
            <div className="exploration-track-base" />
            <div className="exploration-track-fill" style={{ transform: `scaleX(${completion})` }} />
            <div className="relative z-10 grid grid-cols-5 gap-2">
              {missions.map((mission) => (
                <a key={mission.id} href={`#${mission.id}`} className="exploration-track-stop">
                  <span className={`exploration-track-node ${visited[mission.id] ? "is-complete" : ""}`} />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{mission.short}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 lg:border-l lg:border-zinc-800/80 lg:pl-8">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 px-4 py-3 md:hidden">
            <p className="text-[10px] uppercase tracking-[0.26em] text-zinc-500">Next checkpoint</p>
            <p className="mt-2 text-lg font-semibold tracking-tight text-zinc-100">{nextMission?.label ?? "Run complete"}</p>
            <p className="mt-1 text-sm text-zinc-500">
              {nextMission ? `Worth +${nextMission.xp} XP.` : "Every checkpoint is active."}
            </p>
          </div>

          <div className="hidden md:block space-y-3">
          {missions.map((mission) => {
            const unlocked = visited[mission.id];
            return (
              <a
                key={mission.id}
                href={`#${mission.id}`}
                className={`group flex items-start gap-4 rounded-2xl px-4 py-3 transition-all duration-300 ${
                  unlocked
                    ? "bg-zinc-900/70 text-zinc-100"
                    : "bg-zinc-950/50 text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
                }`}
              >
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  unlocked
                    ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-300"
                    : "border-zinc-700 bg-zinc-900 text-zinc-500"
                }`}>
                  {unlocked ? <CheckCircle2 size={14} /> : mission.short.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{mission.label}</p>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-violet-300/90">
                      +{mission.xp} XP
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500 transition-colors group-hover:text-zinc-400">
                    {mission.summary}
                  </p>
                </div>
              </a>
            );
          })}
          </div>

          <div className="pt-2">
            <a
              href={`#${nextMission?.id ?? "about"}`}
              className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 transition-colors hover:border-violet-400/40 hover:bg-violet-500/15"
            >
              {nextMission ? `Next unlock: ${nextMission.short}` : "Run complete"}
              <ArrowUpRight size={14} />
            </a>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.26em] text-zinc-500">Session XP</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100">{xp}</p>
            <p className="mt-2 text-sm text-zinc-500">
              {nextMission
                ? "Keep moving to unlock the next checkpoint."
                : "Every checkpoint is active. The orbit is fully synced."}
            </p>
          </div>
        </div>
      </div>
    </section>
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

/* ─── API Docs Section ─── */
const API_ENDPOINTS = [
  { method: "GET", path: "/api/me", desc: "Profile info" },
  { method: "GET", path: "/api/projects", desc: "All projects" },
  { method: "GET", path: "/api/stats", desc: "Stats & skills" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1 rounded hover:bg-zinc-600/50 transition-colors"
      title="Copy URL"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-zinc-500" />}
    </button>
  );
}

function ApiDocsSection() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { ref, style } = useScrollReveal({ variant: "scale-in" });

  return (
    <section id="api" ref={ref} style={style} className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Terminal size={18} className="text-emerald-400" />
          <h2 className="text-lg font-semibold">Public API</h2>
          <UptimeBadge />
          <a
            href={`${API_BASE}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-100 rounded-md border border-zinc-700 hover:border-zinc-600 transition-colors"
          >
            <BookOpen size={12} /> Swagger Docs
          </a>
        </div>
        <p className="text-sm text-zinc-400">Access this dashboard data programmatically. All endpoints return JSON.</p>
      </div>

      <div className="mx-6 mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/80 border border-zinc-700/50">
        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Base</span>
        <code className="text-xs text-violet-400 flex-1 truncate">{API_BASE}</code>
        <CopyButton text={API_BASE} />
      </div>

      <div className="px-6 pb-6 space-y-2">
        {API_ENDPOINTS.map((endpoint) => {
          const fullUrl = `${API_BASE}${endpoint.path}`;
          const isExpanded = expanded === endpoint.path;
          return (
            <div key={endpoint.path}>
              <div
                onClick={() => setExpanded(isExpanded ? null : endpoint.path)}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-800/30 border border-transparent hover:border-emerald-500/20 hover:bg-zinc-800/60 transition-all duration-200 font-mono text-sm cursor-pointer"
              >
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  {endpoint.method}
                </span>
                <span className="text-zinc-300 group-hover:text-emerald-300 transition-colors truncate">{endpoint.path}</span>
                <span className="text-zinc-500 text-xs font-sans ml-auto hidden sm:inline">{endpoint.desc}</span>
                <CopyButton text={fullUrl} />
                <ChevronDown size={12} className={`text-zinc-600 transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
              </div>
              {isExpanded && <TryItPanel path={endpoint.path} onClose={() => setExpanded(null)} />}
            </div>
          );
        })}
      </div>

      <div className="px-6 py-3 bg-zinc-800/30 border-t border-zinc-800">
        <p className="text-[11px] text-zinc-500 font-mono">
          <span className="text-zinc-400">$</span> curl {API_BASE}/api/me | python -m json.tool
        </p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════ */
export default function Dashboard() {
  const projects = staticProjects;
  const stats = staticStats;

  const { ref: heroRef, progress: heroProgress } = useScrollProgress();
  const contentRef = useRef<HTMLDivElement>(null);
  const {
    completion,
    completedCount,
    lastUnlocked,
    level,
    visited,
    xp,
  } = useMissionProgress(explorationMissions);
  const [activeUnlock, setActiveUnlock] = useState<(typeof explorationMissions)[number] | null>(null);

  const grouped = stats.reduce(
    (acc, s) => {
      (acc[s.category] ??= []).push(s);
      return acc;
    },
    {} as Record<string, Stat[]>
  );

  const heroShift = Math.max(0, heroProgress - 0.15) * 30;
  const orb1Shift = heroProgress * 60;
  const orb2Shift = heroProgress * 35;
  const orbitLift = heroProgress * 18;

  useEffect(() => {
    if (!lastUnlocked) {
      return;
    }

    const unlock = explorationMissions.find((mission) => mission.id === lastUnlocked) ?? null;
    if (!unlock) {
      return;
    }

    setActiveUnlock(unlock);
    const timeout = window.setTimeout(() => setActiveUnlock(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [lastUnlocked]);

  useEffect(() => {
    const renderState = () =>
      JSON.stringify({
        page: "dashboard",
        coordinates: "origin top-left; x increases right; y increases down; scrollY increases downward",
        exploration: {
          completed: explorationMissions.filter((mission) => visited[mission.id]).map((mission) => mission.id),
          completion_percent: Math.round(completion * 100),
          level,
          xp,
        },
        hero: {
          progress: Number(heroProgress.toFixed(2)),
        },
        projects: projects.map((project) => ({ id: project.id, status: project.status })),
      });

    const fallbackAdvanceTime = typeof window.advanceTime === "function"
      ? null
      : (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

    window.render_game_to_text = renderState;
    if (fallbackAdvanceTime) {
      window.advanceTime = fallbackAdvanceTime;
    }

    return () => {
      if (window.render_game_to_text === renderState) {
        delete window.render_game_to_text;
      }
      if (fallbackAdvanceTime && window.advanceTime === fallbackAdvanceTime) {
        delete window.advanceTime;
      }
    };
  }, [completion, heroProgress, level, projects, visited, xp]);

  return (
    <div className="space-y-12">
      {/* ═══ ABOUT ME HERO — Staggered Apple-style Reveal ═══ */}
      <section id="about" ref={heroRef} className="hero-shell relative isolate -mx-4 min-h-[calc(100svh-7rem)] overflow-hidden px-4 py-8 sm:min-h-[85vh] sm:py-12">
        <div className="hero-grid-overlay absolute inset-0" />
        <div className="hero-scanline absolute inset-x-[-8%] top-1/2 h-px" />
        <div className="parallax-orb absolute top-1/4 -left-32 w-96 h-96 bg-violet-500/8 rounded-full blur-[120px]" style={{ transform: `translateY(-${orb1Shift}px)` }} />
        <div className="parallax-orb absolute bottom-1/4 -right-32 w-80 h-80 bg-blue-500/6 rounded-full blur-[100px]" style={{ transform: `translateY(${orb2Shift}px)` }} />

        <div
          className="relative grid min-h-[calc(100svh-7rem)] min-w-0 grid-cols-1 items-center gap-10 sm:min-h-[85vh] lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-12"
          style={{ transform: `translateY(-${heroShift}px)`, transition: "none" }}
        >
          <div className="min-w-0 max-w-[19.5rem] sm:max-w-xl lg:max-w-3xl">
            <div className="hero-reveal hero-reveal-1 mb-5 flex items-center gap-3 sm:mb-6">
              <div className="w-10 h-px bg-violet-500/60" />
              <span className="text-[10px] font-medium uppercase text-violet-400 tracking-[0.24em] sm:text-xs sm:tracking-widest">
                <span className="sm:hidden">Software + ML Engineer</span>
                <span className="hidden sm:inline">Software Engineer &middot; ML Engineer</span>
              </span>
            </div>

            <h1 className="hero-title text-[clamp(4rem,20vw,7.5rem)] font-bold leading-[0.84] tracking-[-0.06em] md:text-7xl lg:text-8xl">
              <HeroNameLine text="Tyron" lineClassName="hero-name-line-1" />
              <HeroNameLine text="Samaroo" lineClassName="hero-name-line-2" tone="hot" />
            </h1>

            <p className="hero-reveal hero-reveal-3 mt-5 max-w-[19ch] text-base leading-relaxed text-zinc-400 sm:max-w-xl sm:text-lg md:text-xl">
              Builds cloud-native systems, ML pipelines, and polished web products.
              <span className="hidden md:inline"> Focused on reliability, event-driven architecture, and shipping real projects.</span>
            </p>

            <div className="hero-reveal hero-reveal-4 mt-7 grid min-w-0 grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
              {[
                { value: "6+", label: "Years Experience", icon: Zap },
                { value: "MS", label: "Data Science", icon: Award },
                { value: "AWS", label: "Certified Dev", icon: Activity },
                { value: `${projects.length}+`, label: "Projects Shipped", icon: Code2 },
              ].map((m, i) => (
                <MetricCard key={m.label} value={m.value} label={m.label} icon={m.icon} delay={i * 200} />
              ))}
            </div>

            <div className="hero-reveal hero-reveal-5 mt-5 grid grid-cols-3 gap-2 sm:mt-8 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
              {[
                { href: "https://github.com/tyronsamaroo", icon: Github, label: "GitHub" },
                { href: "https://linkedin.com/in/tyronsamaroo", icon: Linkedin, label: "LinkedIn" },
                { href: "mailto:tyronsamaroo828@gmail.com", icon: Mail, label: "Email" },
              ].map((link) => (
                <a key={link.label} href={link.href} target={link.href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" className="flex min-w-0 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-400 transition-all hover:border-zinc-700 hover:text-zinc-100 sm:justify-start sm:px-4 sm:text-sm">
                  <link.icon size={16} /> {link.label}
                </a>
              ))}
            </div>

            <div className="hero-reveal hero-reveal-6 mt-6 hidden flex-wrap gap-2 md:flex">
              {staticProfile.skills.map((skill) => (
                <span key={skill} className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">{skill}</span>
              ))}
            </div>

            <div className="hero-reveal hero-reveal-7 mt-5 flex flex-wrap gap-2 md:hidden">
              {signalTape.slice(0, 3).map((item) => (
                <span key={item} className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-zinc-400">
                  <Sparkles size={10} />
                  {item}
                </span>
              ))}
            </div>

            <div className="hero-reveal hero-reveal-7 hero-signal-tape mt-6 hidden md:block">
              <div className="hero-signal-tape-track">
                {[...signalTape, ...signalTape].map((item, index) => (
                  <span key={`${item}-${index}`} className="hero-signal-pill">
                    <Sparkles size={12} />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="hero-reveal hero-reveal-8 mt-8 flex justify-start sm:mt-12">
              <button onClick={() => contentRef.current?.scrollIntoView({ behavior: "smooth" })} className="flex flex-col items-center gap-2 text-zinc-600 transition-colors hover:text-zinc-400 animate-bounce">
                <span className="text-[10px] uppercase tracking-widest">Scroll</span>
                <ArrowDown size={16} />
              </button>
            </div>
          </div>

          <div className="hidden lg:block" style={{ transform: `translateY(-${orbitLift}px)` }}>
            <HeroOrbit
              missions={explorationMissions}
              visited={visited}
              level={level}
              xp={xp}
              completion={completion}
            />
          </div>
        </div>
      </section>

      <div ref={contentRef} />
      <ExplorationRun
        missions={explorationMissions}
        visited={visited}
        completion={completion}
        completedCount={completedCount}
        level={level}
        xp={xp}
      />
      <ScrollDivider />

      {/* ─── Stats Grid with Skill Bars ─── */}
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
      <ExperienceTimeline experience={workExperience} />
      <ScrollDivider />
      <EducationSection education={education} certifications={certifications} />
      <ScrollDivider />

      {projects.length > 0 && <ProjectShowcase projects={projects} />}

      <ScrollDivider />

      {/* ─── API Docs ─── */}
      <ApiDocsSection />

      {/* ─── Footer ─── */}
      <footer className="flex items-center justify-between text-xs text-zinc-600 pb-8">
        <span>Built with React + FastAPI + SQLite &middot; Deployed on Vercel + Render</span>
        <VisitorCounter />
      </footer>

      {activeUnlock && (
        <div className="mission-toast pointer-events-none fixed bottom-4 right-4 z-40 max-w-xs rounded-2xl border border-emerald-500/25 bg-zinc-900/90 px-4 py-3 text-sm shadow-2xl shadow-black/40">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-emerald-500/10 p-2 text-emerald-300">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-emerald-300/85">Mission Complete</p>
              <p className="mt-1 font-medium text-zinc-100">{activeUnlock.label}</p>
              <p className="mt-1 text-zinc-400">+{activeUnlock.xp} XP added to the run.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
