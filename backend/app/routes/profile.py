import json
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.db import get_connection

router = APIRouter()


class ProfileIn(BaseModel):
    name: str
    title: str
    bio: str = ""
    email: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    skills: List[str] = []


class ProfileOut(ProfileIn):
    pass


def _row_to_profile(row) -> dict:
    d = dict(row)
    d["skills"] = json.loads(d.get("skills", "[]"))
    d.pop("id", None)
    return d


@router.get("/api/me", response_model=ProfileOut)
def get_profile():
    conn = get_connection()
    row = conn.execute("SELECT * FROM profile WHERE id = 1").fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Profile not found")
    return _row_to_profile(row)


@router.put("/api/me", response_model=ProfileOut)
def upsert_profile(profile: ProfileIn):
    conn = get_connection()
    data = profile.model_dump()
    data["skills"] = json.dumps(data["skills"])
    conn.execute(
        """INSERT INTO profile (id, name, title, bio, email, github_url, linkedin_url, portfolio_url, skills)
           VALUES (1, :name, :title, :bio, :email, :github_url, :linkedin_url, :portfolio_url, :skills)
           ON CONFLICT(id) DO UPDATE SET
               name=:name, title=:title, bio=:bio, email=:email,
               github_url=:github_url, linkedin_url=:linkedin_url,
               portfolio_url=:portfolio_url, skills=:skills""",
        data,
    )
    conn.commit()
    conn.close()
    return profile.model_dump()
