# ─── What this file does ──────────────────────────────────────────────────────
# This is the entry point of our entire backend — think of it as the reception
# desk of a building. Every request that comes in goes through here first.
#
# It does three things:
#   1. Creates the FastAPI "app" object (the actual web server)
#   2. Registers all our route files (auth, profiles, gigs, etc.)
#   3. Runs a startup check to make sure the database is reachable
#
# When you run `uvicorn main:app`, Python looks for this file and the `app`
# variable inside it. That's the convention FastAPI uses.
# ──────────────────────────────────────────────────────────────────────────────

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.connection import connect_db, disconnect_db
from routes import auth, profiles, gigs, applications, match


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once when the server starts — open the DB connection pool
    await connect_db()
    yield
    # Runs once when the server shuts down — close the pool cleanly
    await disconnect_db()


app = FastAPI(
    title="Good Neighbors API",
    description="Connecting Philly creators with local businesses.",
    version="0.1.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
# CORS = Cross-Origin Resource Sharing.
# Browsers block requests from one domain to another by default (security).
# This tells the backend: "it's okay, let the frontend talk to you."
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ───────────────────────────────────────────────────────────────────
# Each router is a separate file that handles a group of related endpoints.
# The prefix means: auth.py handles /api/auth/*, profiles.py handles /api/profiles/*, etc.
app.include_router(auth.router,         prefix="/api/auth",         tags=["Auth"])
app.include_router(profiles.router,     prefix="/api/profiles",     tags=["Profiles"])
app.include_router(gigs.router,         prefix="/api/gigs",         tags=["Gigs"])
app.include_router(applications.router, prefix="/api/applications", tags=["Applications"])
app.include_router(match.router,        prefix="/api/match",        tags=["Matching"])


@app.get("/")
async def root():
    return {"status": "Good Neighbors API is running"}
