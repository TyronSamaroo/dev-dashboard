export interface Profile {
  name: string;
  title: string;
  bio: string;
  email?: string;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  skills: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tech_stack: string[];
  github_url?: string;
  live_url?: string;
  status: "active" | "completed" | "archived";
  created_at: string;
}

export interface Stat {
  id: string;
  label: string;
  value: string;
  category: "language" | "framework" | "tool" | "metric";
  sort_order: number;
}
