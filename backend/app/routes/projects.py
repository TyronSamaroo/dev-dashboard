import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth import require_api_key
from app.db import get_connection

router = APIRouter()


class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    tech_stack: List[str] = []
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    status: str = Field(default="active", pattern="^(active|completed|archived)$")


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    status: Optional[str] = Field(default=None, pattern="^(active|completed|archived)$")


class ProjectOut(BaseModel):
    id: str
    name: str
    description: str = ""
    tech_stack: List[str] = []
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    status: str
    created_at: str


def _row_to_project(row) -> dict:
    d = dict(row)
    d["tech_stack"] = json.loads(d.get("tech_stack", "[]"))
    return d


@router.get("/api/projects", response_model=List[ProjectOut])
def list_projects():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM projects ORDER BY created_at DESC").fetchall()
    conn.close()
    return [_row_to_project(r) for r in rows]


@router.post("/api/projects", response_model=ProjectOut, status_code=201, dependencies=[Depends(require_api_key)])
def create_project(project: ProjectCreate):
    conn = get_connection()
    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    data = project.model_dump()
    data["id"] = project_id
    data["created_at"] = now
    data["tech_stack"] = json.dumps(data["tech_stack"])
    conn.execute(
        """INSERT INTO projects (id, name, description, tech_stack, github_url, live_url, status, created_at)
           VALUES (:id, :name, :description, :tech_stack, :github_url, :live_url, :status, :created_at)""",
        data,
    )
    conn.commit()
    conn.close()
    data["tech_stack"] = json.loads(data["tech_stack"])
    return data


@router.put("/api/projects/{project_id}", response_model=ProjectOut, dependencies=[Depends(require_api_key)])
def update_project(project_id: str, project: ProjectUpdate):
    conn = get_connection()
    row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")

    existing = dict(row)
    updates = project.model_dump(exclude_unset=True)
    if "tech_stack" in updates:
        updates["tech_stack"] = json.dumps(updates["tech_stack"])
    existing.update(updates)

    conn.execute(
        """UPDATE projects SET name=:name, description=:description, tech_stack=:tech_stack,
           github_url=:github_url, live_url=:live_url, status=:status WHERE id=:id""",
        existing,
    )
    conn.commit()
    conn.close()
    existing["tech_stack"] = json.loads(existing["tech_stack"])
    return existing


@router.delete("/api/projects/{project_id}", status_code=204, dependencies=[Depends(require_api_key)])
def delete_project(project_id: str):
    conn = get_connection()
    row = conn.execute("SELECT id FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")
    conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()
    return None
