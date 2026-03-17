# ─── What this file does ──────────────────────────────────────────────────────
# Handles everything related to user profiles.
#
# Endpoints:
#   GET  /api/profiles/me           — fetch YOUR own profile (artist or business)
#   PUT  /api/profiles/me           — save/update YOUR profile
#   GET  /api/profiles/artist/{id} — view any artist's public profile
#
# Notice all write operations use "me" — users can only edit their own profile.
# Reading someone else's profile is fine (it's public info for matching).
#
# The `Depends(get_current_user)` part is the security gate —
# FastAPI automatically checks the JWT token before the function runs.
# If there's no valid token, the request is rejected with a 401 error.
# ──────────────────────────────────────────────────────────────────────────────

import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel

from db.connection import get_pool
from services.auth import get_current_user
from services.embeddings import embed_artist_profile

router = APIRouter()

# ─── Request shapes ───────────────────────────────────────────────────────────

class ArtistProfileUpdate(BaseModel):
        display_name: str
        bio: str
        category: str
        skills: List[str]
        location: Optional[str] = None
        portfolio_url: Optional[str] = None
        instagram: Optional[str] = None

class BusinessProfileUpdate(BaseModel):
        business_name: str
        description: str
        industry: str
        location: Optional[str] = None
        website: Optional[str] = None

# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
        """
            Returns the logged-in user's own profile.
                Works for both artists and businesses — checks role to know which table.
                    """
        pool = get_pool()
        user_id = current_user["user_id"]
        role = current_user["role"]

    async with pool.acquire() as conn:
                if role == "artist":
                                row = await conn.fetchrow(
                                                    "SELECT * FROM artist_profiles WHERE user_id = $1", user_id
                                )
else:
            row = await conn.fetchrow(
                                "SELECT * FROM business_profiles WHERE user_id = $1", user_id
            )

    if not row:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")
            return dict(row)


@router.put("/me")
async def update_my_profile(
        body: ArtistProfileUpdate | BusinessProfileUpdate,
        background_tasks: BackgroundTasks,
        current_user: dict = Depends(get_current_user),
):
        """
            Save or update the logged-in user's profile.
                For artists: also regenerates the AI embedding in the background.
                    "Background task" means: respond to the user immediately, then generate
                        the embedding afterwards. No waiting around for AI to finish.
                            """
        pool = get_pool()
        user_id = current_user["user_id"]
        role = current_user["role"]

    async with pool.acquire() as conn:
                if role == "artist" and isinstance(body, ArtistProfileUpdate):
                                await conn.execute(
                                                    """
                                                                    UPDATE artist_profiles
                                                                                    SET display_name = $1, bio = $2, category = $3, skills = $4,
                                                                                                        location = $5, portfolio_url = $6, instagram = $7,
                                                                                                                            updated_at = NOW()
                                                                                                                                            WHERE user_id = $8
                                                                                                                                                            """,
                                                    body.display_name, body.bio, body.category, body.skills,
                                                    body.location, body.portfolio_url, body.instagram, user_id,
                                )
                                # Schedule embedding generation — runs after we've already responded
                                background_tasks.add_task(_regenerate_artist_embedding, user_id, body)

elif role == "business" and isinstance(body, BusinessProfileUpdate):
            await conn.execute(
                                """
                                                UPDATE business_profiles
                                                                SET business_name = $1, description = $2, industry = $3,
                                                                                    location = $4, website = $5, updated_at = NOW()
                                                                                                    WHERE user_id = $6
                                                                                                                    """,
                                body.business_name, body.description, body.industry,
                                body.location, body.website, user_id,
            )
else:
            raise HTTPException(
                                status_code=400,
                                detail="Profile type doesn't match your account role.",
            )

    return {"message": "Profile updated."}


@router.get("/artist/{user_id}")
async def get_artist_profile(user_id: str):
        """
            Public endpoint — view any artist's profile by their user ID.
                Used by businesses when browsing matched creators.
                    No auth required (it's public info).
                        """
    pool = get_pool()
    async with pool.acquire() as conn:
                row = await conn.fetchrow(
                    """
                                SELECT display_name, bio, category, skills, location,
                                                   portfolio_url, instagram, gig_count
                                                               FROM artist_profiles WHERE user_id = $1
                                                                           """,
                    user_id,
    )

    if not row:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artist not found.")
    return dict(row)


# ─── Internal helpers ─────────────────────────────────────────────────────────

async def _regenerate_artist_embedding(user_id: str, profile: ArtistProfileUpdate):
        """
            Called in the background after a profile save.
                Generates a fresh Gemini embedding from the new profile content
                    and stores it in the DB — this is what powers the AI matching.

                        FIX: asyncpg cannot pass a Python list to a pgvector column directly.
                            We convert the embedding list to a JSON string before storing it.
                                pgvector accepts '[0.1, 0.2, ...]' as text input.
                                    """
    try:
                embedding = await embed_artist_profile({
                    "display_name": profile.display_name,
                    "bio": profile.bio,
                    "category": profile.category,
                    "skills": profile.skills,
                    "location": profile.location,
    })
        # Convert list to JSON string so asyncpg can pass it to pgvector
        embedding_str = json.dumps(embedding)
        pool = get_pool()
        async with pool.acquire() as conn:
                        await conn.execute(
                                            "UPDATE artist_profiles SET embedding = $1::vector WHERE user_id = $2",
                                            embedding_str, user_id,
                        )
                    print(f"Embedding saved for {user_id}")
except Exception as e:
        print(f"Embedding generation failed for {user_id}: {e}")
