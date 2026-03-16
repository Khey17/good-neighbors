# ─── What this file does ──────────────────────────────────────────────────────
# The AI matching engine — the core feature of Good Neighbors.
#
# Endpoints:
#   GET /api/match/gigs    — artist gets gigs ranked by how well they match
#   GET /api/match/artists — business gets creators ranked for their gig
#
# How matching works (plain English):
#   1. We take the artist's profile (bio, skills, category) and convert it
#      into a list of 1536 numbers called an "embedding". Think of it as
#      plotting the artist's vibe on a map with 1536 dimensions.
#   2. Every gig has its own embedding too — its vibe on the same map.
#   3. We measure the distance between the artist's point and every gig's point.
#      Close = similar vibe = high match score. Far = low match score.
#   4. We return the gigs sorted closest to furthest.
#
# This is called "cosine similarity" — it's the math behind it.
# The `match_gigs` and `match_artists` functions in the DB do that math
# using pgvector, which is a PostgreSQL extension built for exactly this.
# ──────────────────────────────────────────────────────────────────────────────

import json

from fastapi import APIRouter, Depends, HTTPException, Query

from db.connection import get_pool
from services.auth import get_current_user

router = APIRouter()


@router.get("/gigs")
async def match_gigs_to_artist(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=50),
):
    """
    Returns open gigs ranked by how well they match the logged-in artist.
    Requires the artist to have a saved profile with an embedding.
    """
    pool = get_pool()
    user_id = current_user["user_id"]

    async with pool.acquire() as conn:
        # Fetch the artist's embedding from the DB
        row = await conn.fetchrow(
            "SELECT embedding FROM artist_profiles WHERE user_id = $1", user_id
        )

    if not row or not row["embedding"]:
        raise HTTPException(
            status_code=409,
            detail="Complete your profile first so we can find your matches.",
        )

    # The embedding comes back from asyncpg as a string — parse it to a list
    embedding = _parse_embedding(row["embedding"])

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM match_gigs($1::vector, $2)", embedding, limit
        )

    return {"matches": [dict(r) for r in rows]}


@router.get("/artists")
async def match_artists_to_gig(
    gig_id: str = Query(..., description="The gig to find creators for"),
    current_user: dict = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=50),
):
    """
    Returns artists ranked by how well they match a specific gig.
    Used by businesses on their dashboard to discover creators.
    """
    pool = get_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT embedding, business_id FROM gigs WHERE id = $1", gig_id
        )

    if not row:
        raise HTTPException(status_code=404, detail="Gig not found.")

    if str(row["business_id"]) != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your gig.")

    if not row["embedding"]:
        raise HTTPException(
            status_code=409,
            detail="This gig hasn't been embedded yet. Try again in a moment.",
        )

    embedding = _parse_embedding(row["embedding"])

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM match_artists($1::vector, $2)", embedding, limit
        )

    return {"matches": [dict(r) for r in rows]}


# ─── Helper ───────────────────────────────────────────────────────────────────

def _parse_embedding(value) -> list:
    """
    asyncpg returns pgvector values as strings like "[0.1, 0.2, ...]".
    This converts that string back into a Python list of floats
    so we can pass it back into the SQL function.
    """
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        return json.loads(value)
    raise ValueError(f"Unexpected embedding type: {type(value)}")
