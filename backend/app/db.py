import os
import sqlite3
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.getenv("DATABASE_PATH", str(Path(__file__).parent.parent / "dashboard.db"))


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Create tables if they don't exist."""
    conn = get_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            name TEXT NOT NULL,
            title TEXT NOT NULL,
            bio TEXT NOT NULL DEFAULT '',
            email TEXT,
            github_url TEXT,
            linkedin_url TEXT,
            portfolio_url TEXT,
            skills TEXT NOT NULL DEFAULT '[]'
        );

        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            tech_stack TEXT NOT NULL DEFAULT '[]',
            github_url TEXT,
            live_url TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS stats (
            id TEXT PRIMARY KEY,
            label TEXT NOT NULL,
            value TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'metric',
            sort_order INTEGER NOT NULL DEFAULT 0
        );
    """)
    conn.close()
