// ─── Static data — always available, no backend needed ───
// Backend API still works for external consumers, but the
// dashboard itself renders instantly from this file.

import type { Profile, Project, Stat } from "../types";

export const profile: Profile = {
  name: "Tyron Samaroo",
  title: "Software Engineer · ML Engineer",
  bio: "Full-stack engineer with 6+ years building high-scale cloud-native microservices, ML pipelines, and polished web experiences. Focused on reliability, event-driven architectures, and shipping real projects.",
  email: "tyronsamaroo828@gmail.com",
  github_url: "https://github.com/tyronsamaroo",
  linkedin_url: "https://linkedin.com/in/tyronsamaroo",
  skills: [
    "Python",
    "Go",
    "Java",
    "TypeScript",
    "React",
    "Spring Boot",
    "AWS",
    "Docker",
    "Kubernetes",
    "Terraform",
    "Kafka",
    "Redis",
    "PostgreSQL",
  ],
};

export const projects: Project[] = [
  {
    id: "dev-dashboard",
    name: "Personal Developer Dashboard",
    description:
      "A full-stack portfolio dashboard with a FastAPI backend and a React frontend. Showcases projects, skills, and coding stats.",
    tech_stack: ["FastAPI", "React", "DynamoDB", "AWS Lambda", "Tailwind CSS"],
    github_url: "https://github.com/tyronsamaroo/dev-dashboard",
    status: "active",
    created_at: "2026-03-02",
  },
  {
    id: "daily-command-center",
    name: "Daily Command Center",
    description:
      "Unified daily planner combining work block tracking, contest prep, and household coordination in a single Next.js app.",
    tech_stack: ["Next.js", "TypeScript", "Turso", "Drizzle ORM", "Tailwind CSS"],
    github_url: "https://github.com/tyronsamaroo/daily-command-center",
    status: "active",
    created_at: "2026-03-02",
  },
  {
    id: "ml-pipeline-toolkit",
    name: "ML Pipeline Toolkit",
    description:
      "Reusable Python library for building end-to-end ML pipelines with data validation, feature engineering, and model evaluation.",
    tech_stack: ["Python", "PyTorch", "scikit-learn", "Pandas", "Docker"],
    github_url: "https://github.com/tyronsamaroo/ml-pipeline-toolkit",
    status: "active",
    created_at: "2026-03-02",
  },
  {
    id: "ocb-debut-dashboard",
    name: "OCB Debut Dashboard",
    description:
      "Bodybuilding contest-prep tracker with calorie/macro analysis, weight trend visualizations, and progress photo timeline.",
    tech_stack: ["React", "Vite", "Express", "SQLite", "Recharts"],
    github_url: "https://github.com/tyronsamaroo/ocb-debut-dashboard",
    status: "completed",
    created_at: "2026-03-02",
  },
  {
    id: "smart-chore-scheduler",
    name: "Smart Chore Scheduler",
    description:
      "Household task scheduler with fairness scoring, calendar views, and recurring chore management powered by a FastAPI backend.",
    tech_stack: ["React", "Vite", "FastAPI", "Tailwind CSS", "Python"],
    github_url: "https://github.com/tyronsamaroo/smart-chore-scheduler",
    status: "completed",
    created_at: "2026-03-02",
  },
];

export const stats: Stat[] = [
  // Languages
  { id: "lang-python", label: "Python", value: "Advanced", category: "language", sort_order: 1 },
  { id: "lang-go", label: "Go", value: "Advanced", category: "language", sort_order: 2 },
  { id: "lang-java", label: "Java", value: "Proficient", category: "language", sort_order: 3 },
  { id: "lang-typescript", label: "TypeScript", value: "Proficient", category: "language", sort_order: 4 },
  // Frameworks
  { id: "fw-react", label: "React", value: "Advanced", category: "framework", sort_order: 1 },
  { id: "fw-fastapi", label: "FastAPI", value: "Advanced", category: "framework", sort_order: 2 },
  { id: "fw-spring", label: "Spring Boot", value: "Proficient", category: "framework", sort_order: 3 },
  { id: "fw-rails", label: "Ruby on Rails", value: "Familiar", category: "framework", sort_order: 4 },
  // Tools
  { id: "tool-aws", label: "AWS", value: "Certified", category: "tool", sort_order: 1 },
  { id: "tool-docker", label: "Docker", value: "Advanced", category: "tool", sort_order: 2 },
  { id: "tool-k8s", label: "Kubernetes", value: "Proficient", category: "tool", sort_order: 3 },
  { id: "tool-terraform", label: "Terraform", value: "Proficient", category: "tool", sort_order: 4 },
  // Metrics
  { id: "met-kafka", label: "Kafka", value: "Advanced", category: "metric", sort_order: 1 },
  { id: "met-redis", label: "Redis", value: "Advanced", category: "metric", sort_order: 2 },
  { id: "met-postgres", label: "PostgreSQL", value: "Proficient", category: "metric", sort_order: 3 },
  { id: "met-ci", label: "CI/CD", value: "Advanced", category: "metric", sort_order: 4 },
];
