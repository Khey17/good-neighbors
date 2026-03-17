from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.connection import connect_db, disconnect_db, get_pool
from routes import auth, profiles, gigs, applications, match


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    pool = get_pool()
    schema_path = os.path.join(os.path.dirname(__file__), "db", "schema.sql")
    with open(schema_path, "r") as f:
        schema_sql = f.read()
    async with pool.acquire() as conn:
        await conn.execute(schema_sql)
        print("Database schema applied.")
        try:
            await conn.execute(
                "ALTER TABLE artist_profiles ALTER COLUMN embedding TYPE VECTOR(3072) USING embedding::text::VECTOR(3072)"
            )
            await conn.execute(
                "ALTER TABLE gigs ALTER COLUMN embedding TYPE VECTOR(3072) USING embedding::text::VECTOR(3072)"
            )
            await conn.execute("""CREATE OR REPLACE FUNCTION match_gigs(query_embedding VECTOR(3072), match_count INT DEFAULT 10) RETURNS TABLE (id UUID, business_id UUID, title TEXT, category TEXT, description TEXT, pay TEXT, date TEXT, location TEXT, match_score FLOAT) LANGUAGE SQL STABLE AS $$ SELECT g.id, g.business_id, g.title, g.category, g.description, g.pay, g.date, g.location, 1 - (g.embedding <=> query_embedding) AS match_score FROM gigs g WHERE g.status = 'open' AND g.embedding IS NOT NULL ORDER BY g.embedding <=> query_embedding LIMIT match_count; $$""")
            await conn.execute("""CREATE OR REPLACE FUNCTION match_artists(query_embedding VECTOR(3072), match_count INT DEFAULT 10) RETURNS TABLE (user_id UUID, display_name TEXT, category TEXT, skills TEXT[], location TEXT, gig_count INT, match_score FLOAT) LANGUAGE SQL STABLE AS $$ SELECT ap.user_id, ap.display_name, ap.category, ap.skills, ap.location, ap.gig_count, 1 - (ap.embedding <=> query_embedding) AS match_score FROM artist_profiles ap WHERE ap.embedding IS NOT NULL ORDER BY ap.embedding <=> query_embedding LIMIT match_count; $$""")
            print("Vector columns migrated to 3072 dimensions.")
        except Exception as e:
            print(f"Migration note: {e}")
    yield
    await disconnect_db()


app = FastAPI(
    title="Good Neighbors API",
    description="Connecting Philly creators with local businesses.",
    version="0.1.0",
    lifespan=lifespan,
)

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

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["Profiles"])
app.include_router(gigs.router, prefix="/api/gigs", tags=["Gigs"])
app.include_router(applications.router, prefix="/api/applications", tags=["Applications"])
app.include_router(match.router, prefix="/api/match", tags=["Matching"])


@app.get("/")
async def root():
    return {"status": "Good Neighbors API is running"}
