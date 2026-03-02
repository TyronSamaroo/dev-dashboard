import uuid
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.db import get_connection

router = APIRouter()


class StatCreate(BaseModel):
    label: str
    value: str
    category: str = Field(default="metric", pattern="^(language|framework|tool|metric)$")
    sort_order: int = 0


class StatUpdate(BaseModel):
    label: Optional[str] = None
    value: Optional[str] = None
    category: Optional[str] = Field(default=None, pattern="^(language|framework|tool|metric)$")
    sort_order: Optional[int] = None


class StatOut(BaseModel):
    id: str
    label: str
    value: str
    category: str
    sort_order: int


@router.get("/api/stats", response_model=List[StatOut])
def list_stats():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM stats ORDER BY sort_order ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.post("/api/stats", response_model=StatOut, status_code=201)
def create_stat(stat: StatCreate):
    conn = get_connection()
    stat_id = str(uuid.uuid4())
    data = stat.model_dump()
    data["id"] = stat_id
    conn.execute(
        """INSERT INTO stats (id, label, value, category, sort_order)
           VALUES (:id, :label, :value, :category, :sort_order)""",
        data,
    )
    conn.commit()
    conn.close()
    return data


@router.put("/api/stats/{stat_id}", response_model=StatOut)
def update_stat(stat_id: str, stat: StatUpdate):
    conn = get_connection()
    row = conn.execute("SELECT * FROM stats WHERE id = ?", (stat_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Stat not found")

    existing = dict(row)
    updates = stat.model_dump(exclude_unset=True)
    existing.update(updates)

    conn.execute(
        """UPDATE stats SET label=:label, value=:value, category=:category,
           sort_order=:sort_order WHERE id=:id""",
        existing,
    )
    conn.commit()
    conn.close()
    return existing


@router.delete("/api/stats/{stat_id}", status_code=204)
def delete_stat(stat_id: str):
    conn = get_connection()
    row = conn.execute("SELECT id FROM stats WHERE id = ?", (stat_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Stat not found")
    conn.execute("DELETE FROM stats WHERE id = ?", (stat_id,))
    conn.commit()
    conn.close()
    return None
