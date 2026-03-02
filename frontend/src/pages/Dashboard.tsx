import { useEffect, useState } from "react";
import {
  Github,
  Linkedin,
  Mail,
  Globe,
  ExternalLink,
  Code2,
  BarChart3,
  Wrench,
  Layers,
  Activity,
} from "lucide-react";
import { api } from "../api";
import type { Profile, Project, Stat } from "../types";

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

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400",
  completed: "bg-blue-500/10 text-blue-400",
  archived: "bg-zinc-500/10 text-zinc-400",
};

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [p, proj, s] = await Promise.all([
          api.getProfile().catch(() => null),
          api.getProjects().catch(() => []),
          api.getStats().catch(() => []),
        ]);
        setProfile(p);
        setProjects(proj);
        setStats(s);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const grouped = stats.reduce(
    (acc, s) => {
      (acc[s.category] ??= []).push(s);
      return acc;
    },
    {} as Record<string, Stat[]>
  );

  return (
    <div className="space-y-8">
      {/* Profile Hero */}
      {profile && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-2xl font-bold shrink-0">
              {profile.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <p className="text-violet-400 font-medium mt-0.5">
                {profile.title}
              </p>
              <p className="text-zinc-400 mt-2 max-w-2xl leading-relaxed">
                {profile.bio}
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                {profile.github_url && (
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
                  >
                    <Github size={16} /> GitHub
                  </a>
                )}
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
                  >
                    <Linkedin size={16} /> LinkedIn
                  </a>
                )}
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
                  >
                    <Mail size={16} /> Email
                  </a>
                )}
                {profile.portfolio_url && (
                  <a
                    href={profile.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
                  >
                    <Globe size={16} /> Portfolio
                  </a>
                )}
              </div>
              {profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 text-xs font-medium rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Stats Grid */}
      {stats.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={20} className="text-violet-400" />
            <h2 className="text-lg font-semibold">Stats & Skills</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(grouped).map(([category, items]) => (
              <div
                key={category}
                className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
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
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Code2 size={20} className="text-violet-400" />
            <h2 className="text-lg font-semibold">Projects</h2>
            <span className="text-sm text-zinc-500">({projects.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{project.name}</h3>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${statusColors[project.status] ?? ""}`}
                  >
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mt-1.5 line-clamp-2">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {project.tech_stack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 text-xs rounded bg-zinc-800 text-zinc-400"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex gap-3 mt-4 pt-3 border-t border-zinc-800">
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
            ))}
          </div>
        </section>
      )}

      {/* API Docs */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
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

      {/* Footer */}
      <footer className="text-center text-xs text-zinc-600 pb-8">
        Built with React + FastAPI + AWS
      </footer>
    </div>
  );
}
