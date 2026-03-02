import type { Profile, Project, Stat } from "./types";

const BASE = (import.meta.env.VITE_API_URL || "") + "/api";
const CACHE_PREFIX = "dd_cache_";
const CACHE_TS_KEY = "dd_cache_ts";
const TIMEOUT_MS = 6000; // 6s timeout — fast enough for UX, enough for cold starts

/* ─── Cache helpers ─── */
function cacheSet<T>(key: string, data: T) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
    localStorage.setItem(CACHE_TS_KEY, Date.now().toString());
  } catch {
    // storage full or unavailable — silently ignore
  }
}

function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function getCacheAge(): number | null {
  const ts = localStorage.getItem(CACHE_TS_KEY);
  return ts ? Date.now() - Number(ts) : null;
}

export function isCached(): boolean {
  return localStorage.getItem(CACHE_TS_KEY) !== null;
}

/* ─── Track backend status so UI can show indicator ─── */
let _backendOnline = true;
const _listeners = new Set<(online: boolean) => void>();

export function isBackendOnline() {
  return _backendOnline;
}

export function onBackendStatusChange(fn: (online: boolean) => void) {
  _listeners.add(fn);
  return () => { _listeners.delete(fn); };
}

function setBackendStatus(online: boolean) {
  if (_backendOnline !== online) {
    _backendOnline = online;
    _listeners.forEach((fn) => fn(online));
  }
}

/* ─── Fetch with timeout ─── */
async function fetchWithTimeout(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/* ─── Core fetch — tries network, falls back to cache for GETs ─── */
async function fetchJSON<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const isGet = !options?.method || options.method === "GET";
  const cacheKey = url;

  try {
    const res = await fetchWithTimeout(`${BASE}${url}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data: T = await res.json();
    setBackendStatus(true);

    // Cache successful GET responses
    if (isGet) cacheSet(cacheKey, data);

    return data;
  } catch (err) {
    // For GETs: return cached data if available
    if (isGet) {
      const cached = cacheGet<T>(cacheKey);
      if (cached !== null) {
        setBackendStatus(false);
        return cached;
      }
    }
    setBackendStatus(false);
    throw err;
  }
}

/* ─── Write-through: update cache optimistically after mutations ─── */
function updateProjectsCache(fn: (projects: Project[]) => Project[]) {
  const cached = cacheGet<Project[]>("/projects");
  if (cached) cacheSet("/projects", fn(cached));
}

function updateStatsCache(fn: (stats: Stat[]) => Stat[]) {
  const cached = cacheGet<Stat[]>("/stats");
  if (cached) cacheSet("/stats", fn(cached));
}

/* ─── Public API ─── */
export const api = {
  // Profile
  getProfile: () => fetchJSON<Profile>("/me"),
  updateProfile: async (data: Partial<Profile>) => {
    const result = await fetchJSON<Profile>("/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    cacheSet("/me", result);
    return result;
  },

  // Projects
  getProjects: () => fetchJSON<Project[]>("/projects"),
  createProject: async (data: Omit<Project, "id" | "created_at">) => {
    const result = await fetchJSON<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
    updateProjectsCache((p) => [...p, result]);
    return result;
  },
  updateProject: async (id: string, data: Partial<Project>) => {
    const result = await fetchJSON<Project>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    updateProjectsCache((p) => p.map((x) => (x.id === id ? result : x)));
    return result;
  },
  deleteProject: async (id: string) => {
    await fetchJSON<void>(`/projects/${id}`, { method: "DELETE" });
    updateProjectsCache((p) => p.filter((x) => x.id !== id));
  },

  // Stats
  getStats: () => fetchJSON<Stat[]>("/stats"),
  createStat: async (data: Omit<Stat, "id">) => {
    const result = await fetchJSON<Stat>("/stats", {
      method: "POST",
      body: JSON.stringify(data),
    });
    updateStatsCache((s) => [...s, result]);
    return result;
  },
  updateStat: async (id: string, data: Partial<Stat>) => {
    const result = await fetchJSON<Stat>(`/stats/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    updateStatsCache((s) => s.map((x) => (x.id === id ? result : x)));
    return result;
  },
  deleteStat: async (id: string) => {
    await fetchJSON<void>(`/stats/${id}`, { method: "DELETE" });
    updateStatsCache((s) => s.filter((x) => x.id !== id));
  },
};
