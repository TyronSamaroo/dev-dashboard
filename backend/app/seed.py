"""
Seed the database with sample data.

Usage:
    cd backend
    python -m app.seed
"""

import json
import uuid
from datetime import datetime, timezone

from app.db import get_connection, init_db

now = datetime.now(timezone.utc).isoformat()


def seed():
    print("Initializing database...")
    init_db()

    conn = get_connection()

    # Profile
    print("\nSeeding profile...")
    conn.execute(
        """INSERT OR REPLACE INTO profile (id, name, title, bio, email, github_url, linkedin_url, portfolio_url, skills)
           VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            "Tyron Samaroo",
            "ML Engineer / Software Engineer",
            "Full-stack developer with a passion for machine learning, data engineering, "
            "and building polished user experiences. Focused on shipping real projects that "
            "bridge ML and modern web technologies.",
            "tyron@example.com",
            "https://github.com/tyronsamaroo",
            "https://linkedin.com/in/tyronsamaroo",
            "https://tyronsamaroo.dev",
            json.dumps([
                "Python", "TypeScript", "React", "Next.js", "FastAPI",
                "AWS", "Machine Learning", "PyTorch", "SQL", "Docker",
                "Tailwind CSS", "Node.js",
            ]),
        ),
    )
    print("  Inserted profile for Tyron Samaroo")

    # Projects
    print("\nSeeding projects...")
    projects = [
        ("Personal Developer Dashboard",
         "A full-stack portfolio dashboard with a FastAPI backend and a React frontend. Showcases projects, skills, and coding stats.",
         ["FastAPI", "React", "DynamoDB", "AWS Lambda", "Tailwind CSS"],
         "https://github.com/tyronsamaroo/dev-dashboard", "", "active"),
        ("Daily Command Center",
         "Unified daily planner combining work block tracking, contest prep, and household coordination in a single Next.js app.",
         ["Next.js", "TypeScript", "Turso", "Drizzle ORM", "Tailwind CSS"],
         "https://github.com/tyronsamaroo/daily-command-center", "", "active"),
        ("OCB Debut Dashboard",
         "Bodybuilding contest-prep tracker with calorie/macro analysis, weight trend visualizations, and progress photo timeline.",
         ["React", "Vite", "Express", "SQLite", "Recharts"],
         "https://github.com/tyronsamaroo/ocb-debut-dashboard", "", "completed"),
        ("Smart Chore Scheduler",
         "Household task scheduler with fairness scoring, calendar views, and recurring chore management powered by a FastAPI backend.",
         ["React", "Vite", "FastAPI", "Tailwind CSS", "Python"],
         "https://github.com/tyronsamaroo/smart-chore-scheduler", "", "completed"),
        ("ML Pipeline Toolkit",
         "Reusable Python library for building end-to-end ML pipelines with data validation, feature engineering, and model evaluation.",
         ["Python", "PyTorch", "scikit-learn", "Pandas", "Docker"],
         "https://github.com/tyronsamaroo/ml-pipeline-toolkit", "", "active"),
    ]
    for name, desc, tech, github, live, status in projects:
        pid = str(uuid.uuid4())
        conn.execute(
            """INSERT INTO projects (id, name, description, tech_stack, github_url, live_url, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (pid, name, desc, json.dumps(tech), github, live, status, now),
        )
        print(f"  Inserted project: {name}")

    # Stats
    print("\nSeeding stats...")
    stats = [
        ("Python", "Advanced", "language", 1),
        ("TypeScript", "Proficient", "language", 2),
        ("SQL", "Proficient", "language", 3),
        ("React", "Proficient", "framework", 4),
        ("FastAPI", "Proficient", "framework", 5),
        ("Next.js", "Intermediate", "framework", 6),
        ("AWS", "Lambda, DynamoDB, S3, CloudFront", "tool", 7),
        ("Docker", "Intermediate", "tool", 8),
        ("Years Coding", "3+", "metric", 9),
        ("Projects Built", "10+", "metric", 10),
    ]
    for label, value, category, sort_order in stats:
        sid = str(uuid.uuid4())
        conn.execute(
            """INSERT INTO stats (id, label, value, category, sort_order)
               VALUES (?, ?, ?, ?, ?)""",
            (sid, label, value, category, sort_order),
        )
        print(f"  Inserted stat: {label} = {value}")

    conn.commit()
    conn.close()
    print("\nSeeding complete!")


if __name__ == "__main__":
    seed()
