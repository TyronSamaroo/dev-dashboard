import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.db import init_db, get_connection
from app.limiter import limiter
from app.routes.profile import router as profile_router
from app.routes.projects import router as projects_router
from app.routes.stats import router as stats_router
from app.routes.views import router as views_router

app = FastAPI(
    title="Dev Dashboard API",
    description="Backend API for the Personal Developer Dashboard",
    version="1.0.0",
)

# ─── Rate limiting ───
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ─── CORS ───
_default_origins = "http://localhost:5173,http://localhost:5174"
origins = [
    o.strip()
    for o in os.environ.get("ALLOWED_ORIGINS", _default_origins).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile_router)
app.include_router(projects_router)
app.include_router(stats_router)
app.include_router(views_router)

# Create tables on startup and auto-seed if empty
init_db()

conn = get_connection()
row = conn.execute("SELECT COUNT(*) as c FROM profile").fetchone()
conn.close()
if row["c"] == 0:
    from app.seed import seed
    seed()


@app.get("/")
def root():
    return {"message": "Dev Dashboard API", "version": "1.0.0"}


# AWS Lambda handler (for production deployment)
try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except ImportError:
    pass
