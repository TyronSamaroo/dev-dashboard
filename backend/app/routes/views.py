from fastapi import APIRouter
from app.db import get_connection

router = APIRouter(prefix="/api", tags=["views"])


@router.get("/views")
def get_views():
    conn = get_connection()
    row = conn.execute("SELECT count FROM page_views WHERE id = 1").fetchone()
    conn.close()
    count = row["count"] if row else 0
    return {"count": count}


@router.post("/views")
def increment_views():
    conn = get_connection()
    conn.execute(
        "INSERT INTO page_views (id, count) VALUES (1, 1) "
        "ON CONFLICT(id) DO UPDATE SET count = count + 1"
    )
    conn.commit()
    row = conn.execute("SELECT count FROM page_views WHERE id = 1").fetchone()
    conn.close()
    return {"count": row["count"]}
