import type { Profile, Project, Stat } from "./types";

const BASE = (import.meta.env.VITE_API_URL || "") + "/api";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getProfile: () => fetchJSON<Profile>("/me"),
  updateProfile: (data: Partial<Profile>) =>
    fetchJSON<Profile>("/me", { method: "PUT", body: JSON.stringify(data) }),

  getProjects: () => fetchJSON<Project[]>("/projects"),
  createProject: (data: Omit<Project, "id" | "created_at">) =>
    fetchJSON<Project>("/projects", { method: "POST", body: JSON.stringify(data) }),
  updateProject: (id: string, data: Partial<Project>) =>
    fetchJSON<Project>(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProject: (id: string) =>
    fetchJSON<void>(`/projects/${id}`, { method: "DELETE" }),

  getStats: () => fetchJSON<Stat[]>("/stats"),
  createStat: (data: Omit<Stat, "id">) =>
    fetchJSON<Stat>("/stats", { method: "POST", body: JSON.stringify(data) }),
  updateStat: (id: string, data: Partial<Stat>) =>
    fetchJSON<Stat>(`/stats/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteStat: (id: string) =>
    fetchJSON<void>(`/stats/${id}`, { method: "DELETE" }),
};
