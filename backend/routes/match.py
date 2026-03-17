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
    pool = get_pool()
    user_id = current_user["user_id"]
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT embedding FROM artist_profiles WHERE user_id = $1", user_id
        )
    if not row or not row["embedding"]:
        raise HTTPException(
            status_code=409,
            detail="Complete your profile first so we can find your matches.",
        )
    embedding_str = _embedding_to_str(row["embedding"])
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM match_gigs($1::vector, $2)", embedding_str, limit
        )
    return {"matches": [dict(r) for r in rows]}


@router.get("/artists")
async def match_artists_to_gig(
    gig_id: str = Query(..., description="The gig to find creators for"),
    current_user: dict = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=50),
):
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
    embedding_str = _embedding_to_str(row["embedding"])
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM match_artists($1::vector, $2)", embedding_str, limit
        )
    return {"matches": [dict(r) for r in rows]}


def _embedding_to_str(value) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return json.dumps(value)
    raise ValueError(f"Unexpected embedding type: {type(value)}")
