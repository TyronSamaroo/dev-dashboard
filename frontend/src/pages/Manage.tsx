import { useEffect, useState } from "react";
import { Plus, Trash2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "../api";
import type { Profile, Project, Stat } from "../types";

/* ─── Reusable input ─── */
function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  const cls =
    "w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 transition-colors";
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-400 mb-1 block">
        {label}
      </span>
      {textarea ? (
        <textarea
          className={cls + " resize-none h-20"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          className={cls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

/* ─── Section wrapper with collapse ─── */
function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </section>
  );
}

/* ─── Main ─── */
export default function Manage() {
  const [profile, setProfile] = useState<Profile>({
    name: "",
    title: "",
    bio: "",
    email: "",
    github_url: "",
    linkedin_url: "",
    portfolio_url: "",
    skills: [],
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  useEffect(() => {
    api.getProfile().then(setProfile).catch(() => {});
    api.getProjects().then(setProjects).catch(() => {});
    api.getStats().then(setStats).catch(() => {});
  }, []);

  /* ─── Profile ─── */
  async function saveProfile() {
    setSaving("profile");
    try {
      await api.updateProfile(profile);
      flash("Profile saved");
    } catch {
      flash("Failed to save profile");
    } finally {
      setSaving(null);
    }
  }

  function addSkill() {
    const s = skillInput.trim();
    if (s && !profile.skills.includes(s)) {
      setProfile({ ...profile, skills: [...profile.skills, s] });
      setSkillInput("");
    }
  }

  /* ─── Projects ─── */
  const emptyProject: Omit<Project, "id" | "created_at"> = {
    name: "",
    description: "",
    tech_stack: [],
    github_url: "",
    live_url: "",
    status: "active",
  };
  const [newProject, setNewProject] = useState(emptyProject);
  const [techInput, setTechInput] = useState("");

  async function addProject() {
    if (!newProject.name) return;
    setSaving("add-project");
    try {
      const created = await api.createProject(newProject);
      setProjects([...projects, created]);
      setNewProject(emptyProject);
      setTechInput("");
      flash("Project added");
    } catch {
      flash("Failed to add project");
    } finally {
      setSaving(null);
    }
  }

  async function deleteProject(id: string) {
    try {
      await api.deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
      flash("Project deleted");
    } catch {
      flash("Failed to delete");
    }
  }

  /* ─── Stats ─── */
  const emptyStat: Omit<Stat, "id"> = {
    label: "",
    value: "",
    category: "metric",
    sort_order: 0,
  };
  const [newStat, setNewStat] = useState(emptyStat);

  async function addStat() {
    if (!newStat.label || !newStat.value) return;
    setSaving("add-stat");
    try {
      const created = await api.createStat(newStat);
      setStats([...stats, created]);
      setNewStat(emptyStat);
      flash("Stat added");
    } catch {
      flash("Failed to add stat");
    } finally {
      setSaving(null);
    }
  }

  async function deleteStat(id: string) {
    try {
      await api.deleteStat(id);
      setStats(stats.filter((s) => s.id !== id));
      flash("Stat deleted");
    } catch {
      flash("Failed to delete");
    }
  }

  const btnPrimary =
    "flex items-center gap-1.5 px-4 py-2 rounded-md bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-colors disabled:opacity-50";
  const btnDanger =
    "p-1.5 rounded-md hover:bg-red-500/10 text-red-400 transition-colors";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm shadow-xl animate-[fadeIn_0.2s]">
          {toast}
        </div>
      )}

      <h1 className="text-2xl font-bold">Manage Dashboard</h1>

      {/* ─── Profile Section ─── */}
      <Section title="Profile">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="Name"
            value={profile.name}
            onChange={(v) => setProfile({ ...profile, name: v })}
            placeholder="Your name"
          />
          <Field
            label="Title"
            value={profile.title}
            onChange={(v) => setProfile({ ...profile, title: v })}
            placeholder="ML Engineer / SWE"
          />
        </div>
        <Field
          label="Bio"
          value={profile.bio}
          onChange={(v) => setProfile({ ...profile, bio: v })}
          placeholder="Tell the world about yourself..."
          textarea
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="Email"
            value={profile.email ?? ""}
            onChange={(v) => setProfile({ ...profile, email: v })}
            placeholder="you@email.com"
          />
          <Field
            label="GitHub URL"
            value={profile.github_url ?? ""}
            onChange={(v) => setProfile({ ...profile, github_url: v })}
          />
          <Field
            label="LinkedIn URL"
            value={profile.linkedin_url ?? ""}
            onChange={(v) => setProfile({ ...profile, linkedin_url: v })}
          />
          <Field
            label="Portfolio URL"
            value={profile.portfolio_url ?? ""}
            onChange={(v) => setProfile({ ...profile, portfolio_url: v })}
          />
        </div>
        {/* Skills */}
        <div>
          <span className="text-xs font-medium text-zinc-400 mb-1 block">
            Skills
          </span>
          <div className="flex flex-wrap gap-2 mb-2">
            {profile.skills.map((s) => (
              <span
                key={s}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-zinc-800 border border-zinc-700"
              >
                {s}
                <button
                  onClick={() =>
                    setProfile({
                      ...profile,
                      skills: profile.skills.filter((sk) => sk !== s),
                    })
                  }
                  className="text-zinc-500 hover:text-red-400"
                >
                  x
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-violet-500"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSkill()}
              placeholder="Add a skill..."
            />
            <button onClick={addSkill} className={btnPrimary}>
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
        <button
          onClick={saveProfile}
          disabled={saving === "profile"}
          className={btnPrimary}
        >
          <Save size={14} />
          {saving === "profile" ? "Saving..." : "Save Profile"}
        </button>
      </Section>

      {/* ─── Projects Section ─── */}
      <Section title="Projects">
        {/* Existing projects */}
        {projects.length > 0 && (
          <div className="space-y-2">
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-md bg-zinc-800/50 border border-zinc-700/50"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <p className="text-xs text-zinc-500 truncate">
                    {p.tech_stack.join(", ")}
                  </p>
                </div>
                <button
                  onClick={() => deleteProject(p.id)}
                  className={btnDanger}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        {/* Add new */}
        <div className="pt-3 border-t border-zinc-800 space-y-3">
          <p className="text-sm font-medium text-zinc-300">Add New Project</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Name"
              value={newProject.name}
              onChange={(v) => setNewProject({ ...newProject, name: v })}
              placeholder="My Project"
            />
            <div>
              <span className="text-xs font-medium text-zinc-400 mb-1 block">
                Status
              </span>
              <select
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                value={newProject.status}
                onChange={(e) =>
                  setNewProject({
                    ...newProject,
                    status: e.target.value as Project["status"],
                  })
                }
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <Field
            label="Description"
            value={newProject.description}
            onChange={(v) => setNewProject({ ...newProject, description: v })}
            placeholder="What does this project do?"
            textarea
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="GitHub URL"
              value={newProject.github_url ?? ""}
              onChange={(v) => setNewProject({ ...newProject, github_url: v })}
            />
            <Field
              label="Live URL"
              value={newProject.live_url ?? ""}
              onChange={(v) => setNewProject({ ...newProject, live_url: v })}
            />
          </div>
          {/* Tech stack */}
          <div>
            <span className="text-xs font-medium text-zinc-400 mb-1 block">
              Tech Stack
            </span>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {newProject.tech_stack.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-zinc-800 border border-zinc-700"
                >
                  {t}
                  <button
                    onClick={() =>
                      setNewProject({
                        ...newProject,
                        tech_stack: newProject.tech_stack.filter(
                          (x) => x !== t
                        ),
                      })
                    }
                    className="text-zinc-500 hover:text-red-400"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-violet-500"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const t = techInput.trim();
                    if (t && !newProject.tech_stack.includes(t)) {
                      setNewProject({
                        ...newProject,
                        tech_stack: [...newProject.tech_stack, t],
                      });
                      setTechInput("");
                    }
                  }
                }}
                placeholder="Add tech..."
              />
            </div>
          </div>
          <button
            onClick={addProject}
            disabled={saving === "add-project" || !newProject.name}
            className={btnPrimary}
          >
            <Plus size={14} />
            {saving === "add-project" ? "Adding..." : "Add Project"}
          </button>
        </div>
      </Section>

      {/* ─── Stats Section ─── */}
      <Section title="Stats">
        {stats.length > 0 && (
          <div className="space-y-2">
            {stats.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-md bg-zinc-800/50 border border-zinc-700/50"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm">
                    {s.label}: <span className="text-violet-400">{s.value}</span>
                  </p>
                  <p className="text-xs text-zinc-500">{s.category}</p>
                </div>
                <button onClick={() => deleteStat(s.id)} className={btnDanger}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="pt-3 border-t border-zinc-800 space-y-3">
          <p className="text-sm font-medium text-zinc-300">Add New Stat</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Label"
              value={newStat.label}
              onChange={(v) => setNewStat({ ...newStat, label: v })}
              placeholder="Python"
            />
            <Field
              label="Value"
              value={newStat.value}
              onChange={(v) => setNewStat({ ...newStat, value: v })}
              placeholder="Advanced"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs font-medium text-zinc-400 mb-1 block">
                Category
              </span>
              <select
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                value={newStat.category}
                onChange={(e) =>
                  setNewStat({
                    ...newStat,
                    category: e.target.value as Stat["category"],
                  })
                }
              >
                <option value="language">Language</option>
                <option value="framework">Framework</option>
                <option value="tool">Tool</option>
                <option value="metric">Metric</option>
              </select>
            </div>
            <Field
              label="Sort Order"
              value={String(newStat.sort_order)}
              onChange={(v) =>
                setNewStat({ ...newStat, sort_order: parseInt(v) || 0 })
              }
              placeholder="0"
            />
          </div>
          <button
            onClick={addStat}
            disabled={saving === "add-stat" || !newStat.label || !newStat.value}
            className={btnPrimary}
          >
            <Plus size={14} />
            {saving === "add-stat" ? "Adding..." : "Add Stat"}
          </button>
        </div>
      </Section>
    </div>
  );
}
