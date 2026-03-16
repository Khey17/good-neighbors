from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.connection import connect_db, disconnect_db, get_pool
from routes import auth, profiles, gigs, applications, match

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once when the server starts — open the DB connection pool
    await connect_db()
    # Run database schema (creates tables if they don't exist)
    pool = get_pool()
    schema_path = os.path.join(os.path.dirname(__file__), "db", "schema.sql")
    with open(schema_path, "r") as f:
        schema_sql = f.read()
    async with pool.acquire() as conn:
        await conn.execute(schema_sql)
    print("Database schema applied.")
    yield
    # Runs once when the server shuts down — close the pool cleanly
    await disconnect_db()

app = FastAPI(
    title="Good Neighbors API",
    description="Connecting Philly creators with local businesses.",
    version="0.1.0",
    lifespan=lifespan,
)

# ─── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://amusing-joy-production-3473.up.railway.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ─────────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["Profiles"])
app.include_router(gigs.router, prefix="/api/gigs", tags=["Gigs"])
app.include_router(applications.router, prefix="/api/applications", tags=["Applications"])
app.include_router(match.router, prefix="/api/match", tags=["Matching"])

@app.get("/")
async def root():
    return {"status": "Good Neighbors API is running"}
