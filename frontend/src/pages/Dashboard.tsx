import { useRef, useState } from "react";
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
import { RollingCounter } from "../components/RollingDigit";

const API_BASE = "https://dev-dashboard-api.onrender.com";

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
  growing = false,
}: {
  value: string;
  label: string;
  icon: React.ElementType;
  delay: number;
  growing?: boolean;
}) {
  const numMatch = value.match(/^(\d+)/);
  const target = numMatch ? parseInt(numMatch[1], 10) : 0;
  const suffix = numMatch ? value.slice(numMatch[1].length) : "";
  const hasNumber = target > 0;

  return (
    <div className="hero-metric rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex flex-col gap-2">
      <Icon size={16} className="text-violet-400" />
      <div className="text-2xl font-bold counter-number">
        {hasNumber ? (
          <RollingCounter value={target} suffix={suffix} delay={delay} growing={growing} />
        ) : (
          value
        )}
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
    <section ref={ref} style={style} className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
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

  return (
    <div className="space-y-12">
      {/* ═══ ABOUT ME HERO — Staggered Apple-style Reveal ═══ */}
      <section id="about" ref={heroRef} className="relative min-h-[85vh] flex flex-col justify-center py-12 overflow-hidden">
        <div className="parallax-orb absolute top-1/4 -left-32 w-96 h-96 bg-violet-500/8 rounded-full blur-[120px]" style={{ transform: `translateY(-${orb1Shift}px)` }} />
        <div className="parallax-orb absolute bottom-1/4 -right-32 w-80 h-80 bg-blue-500/6 rounded-full blur-[100px]" style={{ transform: `translateY(${orb2Shift}px)` }} />

        <div style={{ transform: `translateY(-${heroShift}px)`, transition: "none" }}>
          <div className="hero-reveal hero-reveal-1 flex items-center gap-3 mb-6">
            <div className="w-10 h-px bg-violet-500/60" />
            <span className="text-xs font-medium tracking-widest uppercase text-violet-400">Software Engineer &middot; ML Engineer</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]">
            <span className="block text-clip-reveal text-clip-reveal-1">Tyron</span>
            <span className="block text-clip-reveal text-clip-reveal-2 bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">Samaroo</span>
          </h1>

          <p className="hero-reveal hero-reveal-3 text-lg md:text-xl text-zinc-400 mt-6 max-w-2xl leading-relaxed">{staticProfile.bio}</p>

          <div className="hero-reveal hero-reveal-4 grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {[
              { value: "6+", label: "Years Experience", icon: Zap, growing: true },
              { value: "MS", label: "Data Science", icon: Award },
              { value: "AWS", label: "Certified Dev", icon: Activity },
              { value: "8+", label: "Projects Shipped", icon: Code2 },
            ].map((m, i) => (
              <MetricCard key={m.label} value={m.value} label={m.label} icon={m.icon} delay={i * 200} growing={"growing" in m} />
            ))}
          </div>

          <div className="hero-reveal hero-reveal-5 flex flex-wrap items-center gap-4 mt-8">
            {[
              { href: "https://github.com/tyronsamaroo", icon: Github, label: "GitHub" },
              { href: "https://linkedin.com/in/tyronsamaroo", icon: Linkedin, label: "LinkedIn" },
              { href: "mailto:tyronsamaroo828@gmail.com", icon: Mail, label: "Email" },
            ].map((link) => (
              <a key={link.label} href={link.href} target={link.href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all">
                <link.icon size={16} /> {link.label}
              </a>
            ))}
          </div>

          <div className="hero-reveal hero-reveal-6 flex flex-wrap gap-2 mt-6">
            {staticProfile.skills.map((skill) => (
              <span key={skill} className="px-2.5 py-1 text-xs font-medium rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">{skill}</span>
            ))}
          </div>

          <div className="hero-reveal hero-reveal-7 flex justify-center mt-12">
            <button onClick={() => contentRef.current?.scrollIntoView({ behavior: "smooth" })} className="flex flex-col items-center gap-2 text-zinc-600 hover:text-zinc-400 transition-colors animate-bounce">
              <span className="text-[10px] uppercase tracking-widest">Scroll</span>
              <ArrowDown size={16} />
            </button>
          </div>
        </div>
      </section>

      <div ref={contentRef} />
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
    </div>
  );
}
