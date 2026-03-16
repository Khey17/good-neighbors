# ─── What this file does ──────────────────────────────────────────────────────
# Handles everything related to gigs.
#
# Endpoints:
#   POST /api/gigs          — business posts a new gig
#   GET  /api/gigs          — list all open gigs (with optional filters)
#   GET  /api/gigs/mine     — business sees their own posted gigs
#   GET  /api/gigs/{id}     — get a single gig's full detail
#
# Only businesses can post gigs — enforced by require_role("business").
# Anyone can read gigs — no auth needed for browsing.
# ──────────────────────────────────────────────────────────────────────────────

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel

from db.connection import get_pool
from services.auth import get_current_user, require_role
from services.embeddings import embed_gig

router = APIRouter()


# ─── Request shape ────────────────────────────────────────────────────────────

class GigCreate(BaseModel):
    title: str
    description: str
    category: str
    pay: Optional[str] = None
    location: Optional[str] = None
    date: Optional[str] = None


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/", status_code=status.HTTP_201_CREATED)
async def post_gig(
    body: GigCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_role("business")),
):
    """
    Business posts a new gig.
    The embedding is generated in the background so the response is instant.
    """
    pool = get_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO gigs (business_id, title, description, category, pay, location, date)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, title, category, status, created_at
            """,
            current_user["user_id"], body.title, body.description,
            body.category, body.pay, body.location, body.date,
        )

    gig_id = str(row["id"])

    # Generate embedding after responding — no waiting
    background_tasks.add_task(_embed_gig, gig_id, body)

    return {**dict(row), "id": gig_id}


@router.get("/mine")
async def my_gigs(current_user: dict = Depends(require_role("business"))):
    """
    Returns all gigs posted by the logged-in business, with applicant counts.
    """
    pool = get_pool()

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT g.id, g.title, g.category, g.status, g.pay, g.date, g.location,
                   COUNT(a.id) AS applicant_count
            FROM gigs g
            LEFT JOIN applications a ON a.gig_id = g.id
            WHERE g.business_id = $1
            GROUP BY g.id
            ORDER BY g.created_at DESC
            """,
            current_user["user_id"],
        )

    return {"gigs": [dict(r) for r in rows]}


@router.get("/{gig_id}")
async def get_gig(gig_id: str):
    """Get a single gig's full details. Public — no auth needed."""
    pool = get_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT g.*, bp.business_name
            FROM gigs g
            JOIN business_profiles bp ON bp.user_id = g.business_id
            WHERE g.id = $1
            """,
            gig_id,
        )

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found.")

    return dict(row)


# ─── Internal helpers ─────────────────────────────────────────────────────────

async def _embed_gig(gig_id: str, body: GigCreate):
    """Generate and store a Gemini embedding for a newly posted gig."""
    try:
        embedding = await embed_gig({
            "title": body.title,
            "description": body.description,
            "category": body.category,
            "location": body.location,
        })
        pool = get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE gigs SET embedding = $1 WHERE id = $2",
                embedding, gig_id,
            )
    except Exception as e:
        print(f"Gig embedding failed for {gig_id}: {e}")
