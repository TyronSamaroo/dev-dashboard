import { useEffect, useRef, useState } from "react";
import {
  Github,
  Linkedin,
  Mail,
  Gamepad2,
  Gauge,
  Shield,
  Maximize2,
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

type ExplorationMission = (typeof explorationMissions)[number];

const inactiveMissions: readonly (typeof explorationMissions)[number][] = [];

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

const sectorProfiles: Record<
  ExplorationMission["id"],
  {
    code: string;
    title: string;
    threat: string;
    briefing: string;
  }
> = {
  skills: {
    code: "Sector 01",
    title: "Skill Matrix Breach",
    threat: "Adaptive",
    briefing: "Sweep the stack matrix, light the capability rails, and extract the core toolkit.",
  },
  experience: {
    code: "Sector 02",
    title: "Systems Timeline Raid",
    threat: "Escalating",
    briefing: "Traverse the production arc, tag the wins, and chain the strongest engineering moments.",
  },
  education: {
    code: "Sector 03",
    title: "Training Vault Unlock",
    threat: "Guarded",
    briefing: "Crack open the academic and certification vault before the route cools off.",
  },
  projects: {
    code: "Sector 04",
    title: "Build Bay Inspection",
    threat: "High Value",
    briefing: "Sweep the shipped builds, inspect active payloads, and bank the delivery score.",
  },
  api: {
    code: "Sector 05",
    title: "Public Interface Boss",
    threat: "Critical",
    briefing: "Hit the public API surface, expose the docs, and finish the run at full sync.",
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

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
  explosive = false,
}: {
  value: string;
  label: string;
  icon: React.ElementType;
  delay: number;
  explosive?: boolean;
}) {
  const numMatch = value.match(/^(\d+)/);
  const target = numMatch ? parseInt(numMatch[1], 10) : 0;
  const suffix = numMatch ? value.slice(numMatch[1].length) : "";
  const hasNumber = target > 0;

  const { ref, value: count, done } = useCountUp(target, {
    duration: 2500,
    delay,
    allowOvershoot: explosive,
  });

  return (
    <div
      ref={hasNumber ? ref : undefined}
      className={`hero-metric rounded-[22px] border border-zinc-800 bg-zinc-900/50 px-4 py-4 sm:p-4 flex min-w-0 flex-col gap-2 ${
        explosive && done && hasNumber ? "metric-burst-active" : ""
      }`}
    >
      {explosive && <span className="metric-flare" aria-hidden="true" />}
      <Icon size={16} className="text-violet-400" />
      <div className={`text-[1.95rem] font-bold leading-none counter-number ${explosive && done && hasNumber ? "stat-highlight" : ""}`}>
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

function GameControlDeck({
  nextMission,
  completionPercent,
  completedCount,
  comboMultiplier,
  runScore,
  heat,
  shield,
  threat,
  overdriveActive,
  overdriveBursts,
  isFullscreen,
  achievements,
  onTriggerOverdrive,
  onJumpToNext,
  onToggleFullscreen,
}: {
  nextMission: ExplorationMission | null;
  completionPercent: number;
  completedCount: number;
  comboMultiplier: number;
  runScore: number;
  heat: number;
  shield: number;
  threat: number;
  overdriveActive: boolean;
  overdriveBursts: number;
  isFullscreen: boolean;
  achievements: string[];
  onTriggerOverdrive: () => void;
  onJumpToNext: () => void;
  onToggleFullscreen: () => void;
}) {
  return (
    <div className="game-control-deck relative overflow-hidden rounded-[30px] border border-violet-500/20 px-5 py-5">
      <div className="game-control-deck-grid" />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em] text-violet-300/90">
            <Gamepad2 size={14} />
            Operator HUD
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-zinc-500">Run score</p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-zinc-100 sm:text-5xl">
                {runScore.toLocaleString()}
              </p>
            </div>
            <div className={`game-status-badge ${overdriveActive ? "is-live" : ""}`}>
              {overdriveActive ? "Overdrive Live" : "Reactor Primed"}
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
            Press <span className="text-zinc-200">Space</span> to detonate the route,{" "}
            <span className="text-zinc-200">Enter</span> to snap to the next sector, and{" "}
            <span className="text-zinc-200">F</span> to go full screen.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Combo", value: `x${comboMultiplier.toFixed(1)}` },
              { label: "Sync", value: `${completionPercent}%` },
              { label: "Cleared", value: `${completedCount}/5` },
              { label: "Bursts", value: overdriveBursts.toString().padStart(2, "0") },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-zinc-800/80 bg-zinc-950/65 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-zinc-100">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {achievements.map((achievement) => (
              <span
                key={achievement}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-zinc-300"
              >
                <Sparkles size={12} />
                {achievement}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="game-control-panel">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-zinc-100">
                <Gauge size={15} className="text-violet-300" />
                Threat Envelope
              </div>
              <span className="text-sm font-semibold text-zinc-100">{threat}%</span>
            </div>
            <div className="game-meter mt-3">
              <span className="game-meter-threat" style={{ transform: `scaleX(${threat / 100})` }} />
            </div>
            <p className="mt-3 text-sm text-zinc-500">
              {nextMission
                ? `${sectorProfiles[nextMission.id].title} is the next live target.`
                : "Boss phase complete. Every route segment is fully synced."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="game-control-panel">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-zinc-100">
                <Shield size={15} className="text-emerald-300" />
                Shield
              </div>
              <div className="game-meter mt-3">
                <span className="game-meter-shield" style={{ transform: `scaleX(${shield / 100})` }} />
              </div>
              <p className="mt-3 text-lg font-semibold text-zinc-100">{shield}%</p>
            </div>

            <div className="game-control-panel">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-zinc-100">
                <Zap size={15} className="text-amber-300" />
                Heat
              </div>
              <div className="game-meter mt-3">
                <span className="game-meter-heat" style={{ transform: `scaleX(${heat / 100})` }} />
              </div>
              <p className="mt-3 text-lg font-semibold text-zinc-100">{heat}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button type="button" onClick={onTriggerOverdrive} className="game-control-button game-control-button-primary">
              <Zap size={15} />
              {overdriveActive ? "Pulse Again" : "Trigger Pulse"}
            </button>
            <button type="button" onClick={onJumpToNext} className="game-control-button">
              <Target size={15} />
              {nextMission ? `Jump ${nextMission.short}` : "Replay Route"}
            </button>
            <button type="button" onClick={onToggleFullscreen} className="game-control-button">
              <Maximize2 size={15} />
              {isFullscreen ? "Exit Full" : "Full Screen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectorBanner({
  mission,
  index,
  unlocked,
  isNext,
  overdriveActive,
  comboMultiplier,
}: {
  mission: ExplorationMission;
  index: number;
  unlocked: boolean;
  isNext: boolean;
  overdriveActive: boolean;
  comboMultiplier: number;
}) {
  const profile = sectorProfiles[mission.id];
  const status = unlocked ? "Cleared" : isNext ? "Prime Target" : "Standby";

  return (
    <a
      href={`#${mission.id}`}
      className={`sector-banner group relative block overflow-hidden rounded-[28px] border border-zinc-800/90 px-5 py-5 ${
        unlocked ? "is-cleared" : isNext ? "is-next" : ""
      } ${overdriveActive ? "is-overdrive" : ""}`}
    >
      <div className="sector-banner-grid" />
      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="sector-banner-code">{profile.code}</span>
            <span className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
              Sequence {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-100">{profile.title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-400">{profile.briefing}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[420px]">
          {[
            { label: "Status", value: status },
            { label: "Threat", value: profile.threat },
            { label: "Reward", value: `+${mission.xp} XP` },
            { label: "Combo", value: `x${comboMultiplier.toFixed(1)}` },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-zinc-800/80 bg-zinc-950/65 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">{item.label}</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-100">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </a>
  );
}

function ExplorationRun({
  missions,
  visited,
  completion,
  completedCount,
  level,
  xp,
  comboMultiplier,
  runScore,
  overdriveBursts,
}: {
  missions: typeof explorationMissions;
  visited: Record<string, boolean>;
  completion: number;
  completedCount: number;
  level: number;
  xp: number;
  comboMultiplier: number;
  runScore: number;
  overdriveBursts: number;
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
            Mission Board
          </div>

          <h2 className="mt-4 max-w-[15ch] text-2xl font-semibold tracking-tight text-zinc-100 sm:max-w-3xl sm:text-3xl md:text-4xl">
            Run the portfolio like a boss fight, not a brochure.
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
            Every sector you clear pumps score, stacks multiplier, and drives the dashboard toward full system sync.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[
              { label: "Run score", value: runScore.toLocaleString() },
              { label: "Combo", value: `x${comboMultiplier.toFixed(1)}` },
              { label: "Rank", value: getRankLabel(level) },
              { label: "Pulse count", value: overdriveBursts.toString().padStart(2, "0") },
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
              {nextMission ? `Worth +${nextMission.xp} XP and pushes the combo higher.` : "Every checkpoint is active."}
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
              {nextMission ? `Engage next sector: ${nextMission.short}` : "Run complete"}
              <ArrowUpRight size={14} />
            </a>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.26em] text-zinc-500">Session XP</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100">{xp}</p>
            <p className="mt-2 text-sm text-zinc-500">
              {nextMission
                ? `Completion is ${completionPercent}% with ${completedCount}/${missions.length} sectors cleared.`
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
export default function Dashboard({ gameMode = false }: { gameMode?: boolean }) {
  const projects = staticProjects;
  const stats = staticStats;
  const activeMissions = gameMode ? explorationMissions : inactiveMissions;

  const { ref: heroRef, progress: heroProgress } = useScrollProgress();
  const contentRef = useRef<HTMLDivElement>(null);
  const {
    completion,
    completedCount,
    lastUnlocked,
    level,
    visited,
    xp,
  } = useMissionProgress(activeMissions);
  const [activeUnlock, setActiveUnlock] = useState<ExplorationMission | null>(null);
  const [xpBurst, setXpBurst] = useState<ExplorationMission | null>(null);
  const [overdriveActive, setOverdriveActive] = useState(false);
  const [overdriveBursts, setOverdriveBursts] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const overdriveTimeoutRef = useRef<number | null>(null);

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
  const nextMission = activeMissions.find((mission) => !visited[mission.id]) ?? null;
  const completionPercent = Math.round(completion * 100);
  const comboMultiplier = gameMode
    ? Number((1 + completedCount * 0.65 + Math.min(overdriveBursts, 5) * 0.2 + (overdriveActive ? 1.35 : 0)).toFixed(1))
    : 1;
  const runScore = gameMode ? Math.round(xp * 125 * comboMultiplier + completedCount * 220 + overdriveBursts * 180) : 0;
  const threat = gameMode ? (nextMission ? clamp(84 - completedCount * 12 + (overdriveActive ? 10 : 0), 18, 96) : 5) : 0;
  const shield = gameMode ? clamp(58 + completedCount * 8 + completion * 28 + (overdriveActive ? 14 : 0), 36, 100) : 0;
  const heat = gameMode ? clamp(24 + overdriveBursts * 8 + (overdriveActive ? 24 : 0), 18, 100) : 0;
  const achievementRack = gameMode
    ? [
        completedCount > 0 ? "Sector chain online" : "Prime the route",
        overdriveBursts > 0 ? `Pulse x${overdriveBursts}` : "Charge the reactor",
        nextMission ? `${sectorProfiles[nextMission.id].code} armed` : "Boss clear confirmed",
      ]
    : [];

  const triggerOverdrive = () => {
    if (!gameMode) {
      return;
    }

    setOverdriveBursts((current) => current + 1);
    setOverdriveActive(true);

    if (overdriveTimeoutRef.current) {
      window.clearTimeout(overdriveTimeoutRef.current);
    }

    overdriveTimeoutRef.current = window.setTimeout(() => {
      setOverdriveActive(false);
      overdriveTimeoutRef.current = null;
    }, 2200);
  };

  const jumpToNextMission = () => {
    if (!gameMode) {
      return;
    }

    const targetId = nextMission?.id ?? "about";
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleFullscreen = async () => {
    if (!gameMode || typeof document === "undefined") {
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      /* Fullscreen requires a user gesture and may be rejected on some browsers. */
    }
  };

  useEffect(() => {
    if (!gameMode || !lastUnlocked) {
      return;
    }

    const unlock = explorationMissions.find((mission) => mission.id === lastUnlocked) ?? null;
    if (!unlock) {
      return;
    }

    setActiveUnlock(unlock);
    setXpBurst(unlock);
    const unlockTimeout = window.setTimeout(() => setActiveUnlock(null), 2400);
    const burstTimeout = window.setTimeout(() => setXpBurst(null), 1350);
    return () => {
      window.clearTimeout(unlockTimeout);
      window.clearTimeout(burstTimeout);
    };
  }, [lastUnlocked]);

  useEffect(() => {
    if (!gameMode) {
      setIsFullscreen(false);
      setOverdriveActive(false);
      return;
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    handleFullscreenChange();
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [gameMode]);

  useEffect(() => {
    if (!gameMode) {
      return;
    }

    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        triggerOverdrive();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        jumpToNextMission();
        return;
      }

      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        void toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [gameMode, nextMission, overdriveBursts, overdriveActive]);

  useEffect(() => {
    return () => {
      if (overdriveTimeoutRef.current) {
        window.clearTimeout(overdriveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const renderState = () =>
      JSON.stringify({
        page: gameMode ? "dashboard-game-on" : "dashboard",
        coordinates: "origin top-left; x increases right; y increases down; scrollY increases downward",
        game_mode: gameMode,
        game: {
          mode: gameMode ? "overdrive" : "classic",
          controls: gameMode ? ["space=overdrive", "enter=next-sector", "f=fullscreen"] : [],
          overdrive_active: overdriveActive,
          overdrive_bursts: overdriveBursts,
          combo_multiplier: comboMultiplier,
          score: runScore,
          heat,
          shield,
          threat,
          fullscreen: isFullscreen,
          next_target: nextMission?.id ?? null,
        },
        exploration: {
          completed: activeMissions.filter((mission) => visited[mission.id]).map((mission) => mission.id),
          completion_percent: completionPercent,
          level: gameMode ? level : 0,
          xp: gameMode ? xp : 0,
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
  }, [
    activeMissions,
    comboMultiplier,
    completionPercent,
    gameMode,
    heat,
    heroProgress,
    isFullscreen,
    level,
    nextMission,
    overdriveActive,
    overdriveBursts,
    projects,
    runScore,
    shield,
    threat,
    visited,
    xp,
  ]);

  return (
    <div className={`relative space-y-12 ${gameMode ? `game-mode-shell${overdriveActive ? " is-overdrive" : ""}` : ""}`}>
      {gameMode && (
        <>
          <div className="game-shell-ambience" aria-hidden="true" />
          <div className="game-shell-noise" aria-hidden="true" />
          {overdriveActive && (
            <div className="game-overdrive-wave" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          )}
        </>
      )}

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
              {gameMode ? (
                <>
                  <HeroNameLine text="Tyron" lineClassName="hero-name-line-1" />
                  <HeroNameLine text="Samaroo" lineClassName="hero-name-line-2" tone="hot" />
                </>
              ) : (
                <>
                  <span className="block hero-name-soft-reveal hero-name-soft-reveal-1">Tyron</span>
                  <span className="block hero-name-soft-reveal hero-name-soft-reveal-2 bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">Samaroo</span>
                </>
              )}
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
                <MetricCard key={m.label} value={m.value} label={m.label} icon={m.icon} delay={i * 200} explosive={gameMode} />
              ))}
            </div>

            {gameMode && (
              <div className="hero-reveal hero-reveal-5 mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2 md:hidden">
                <div className="rounded-[24px] border border-zinc-800/90 bg-zinc-950/70 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">Mobile HUD</p>
                  <div className="mt-2 flex items-center gap-3">
                    <p className="text-xl font-semibold tracking-tight text-zinc-100">{runScore.toLocaleString()}</p>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-violet-300">x{comboMultiplier.toFixed(1)}</span>
                  </div>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                    {nextMission ? `Next ${nextMission.short}` : "Route Complete"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={triggerOverdrive}
                  className="game-control-button game-control-button-primary h-full px-4"
                >
                  <Zap size={15} />
                  Pulse
                </button>
              </div>
            )}

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

            {gameMode && (
              <>
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
              </>
            )}

            {gameMode && (
              <div className="hero-reveal hero-reveal-8 mt-6">
                <GameControlDeck
                  nextMission={nextMission}
                  completionPercent={completionPercent}
                  completedCount={completedCount}
                  comboMultiplier={comboMultiplier}
                  runScore={runScore}
                  heat={heat}
                  shield={shield}
                  threat={threat}
                  overdriveActive={overdriveActive}
                  overdriveBursts={overdriveBursts}
                  isFullscreen={isFullscreen}
                  achievements={achievementRack}
                  onTriggerOverdrive={triggerOverdrive}
                  onJumpToNext={jumpToNextMission}
                  onToggleFullscreen={toggleFullscreen}
                />
              </div>
            )}

            <div className={`hero-reveal ${gameMode ? "hero-reveal-9" : "hero-reveal-8"} mt-8 flex justify-start sm:mt-12`}>
              <button onClick={() => contentRef.current?.scrollIntoView({ behavior: "smooth" })} className="flex flex-col items-center gap-2 text-zinc-600 transition-colors hover:text-zinc-400 animate-bounce">
                <span className="text-[10px] uppercase tracking-widest">Scroll</span>
                <ArrowDown size={16} />
              </button>
            </div>
          </div>

          {gameMode && (
            <div className="hidden lg:block" style={{ transform: `translateY(-${orbitLift}px)` }}>
              <HeroOrbit
                missions={explorationMissions}
                visited={visited}
                level={level}
                xp={xp}
                completion={completion}
              />
            </div>
          )}
        </div>
      </section>

      <div ref={contentRef} />
      {gameMode && (
        <>
          <ExplorationRun
            missions={explorationMissions}
            visited={visited}
            completion={completion}
            completedCount={completedCount}
            level={level}
            xp={xp}
            comboMultiplier={comboMultiplier}
            runScore={runScore}
            overdriveBursts={overdriveBursts}
          />
          <ScrollDivider />
        </>
      )}

      {/* ─── Stats Grid with Skill Bars ─── */}
      {gameMode && (
        <SectorBanner
          mission={explorationMissions[0]}
          index={0}
          unlocked={Boolean(visited.skills)}
          isNext={nextMission?.id === "skills"}
          overdriveActive={overdriveActive}
          comboMultiplier={comboMultiplier}
        />
      )}
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
      {gameMode && (
        <SectorBanner
          mission={explorationMissions[1]}
          index={1}
          unlocked={Boolean(visited.experience)}
          isNext={nextMission?.id === "experience"}
          overdriveActive={overdriveActive}
          comboMultiplier={comboMultiplier}
        />
      )}
      <ExperienceTimeline experience={workExperience} gameMode={gameMode} />
      <ScrollDivider />
      {gameMode && (
        <SectorBanner
          mission={explorationMissions[2]}
          index={2}
          unlocked={Boolean(visited.education)}
          isNext={nextMission?.id === "education"}
          overdriveActive={overdriveActive}
          comboMultiplier={comboMultiplier}
        />
      )}
      <EducationSection education={education} certifications={certifications} />
      <ScrollDivider />

      {gameMode && (
        <SectorBanner
          mission={explorationMissions[3]}
          index={3}
          unlocked={Boolean(visited.projects)}
          isNext={nextMission?.id === "projects"}
          overdriveActive={overdriveActive}
          comboMultiplier={comboMultiplier}
        />
      )}
      {projects.length > 0 && <ProjectShowcase projects={projects} gameMode={gameMode} />}

      <ScrollDivider />

      {/* ─── API Docs ─── */}
      {gameMode && (
        <SectorBanner
          mission={explorationMissions[4]}
          index={4}
          unlocked={Boolean(visited.api)}
          isNext={nextMission?.id === "api"}
          overdriveActive={overdriveActive}
          comboMultiplier={comboMultiplier}
        />
      )}
      <ApiDocsSection />

      {/* ─── Footer ─── */}
      <footer className="flex items-center justify-between text-xs text-zinc-600 pb-8">
        <span>Built with React + FastAPI + SQLite &middot; Deployed on Vercel + Render</span>
        <VisitorCounter />
      </footer>

      {gameMode && activeUnlock && (
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

      {gameMode && xpBurst && (
        <div className="xp-burst pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
          <div className="xp-burst-core">
            <p className="xp-burst-kicker">{sectorProfiles[xpBurst.id].code} Cleared</p>
            <strong>+{xpBurst.xp} XP</strong>
            <span>{xpBurst.label}</span>
          </div>
        </div>
      )}
    </div>
  );
}
