import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel

from db.connection import get_pool
from services.auth import get_current_user
from services.embeddings import embed_artist_profile

router = APIRouter()


class ArtistProfileUpdate(BaseModel):
    display_name: str
    bio: str
    category: str
    skills: List[str]
    location: str | None = None
    portfolio_url: str | None = None
    instagram: str | None = None


class BusinessProfileUpdate(BaseModel):
    business_name: str
    description: str
    industry: str
    location: str | None = None
    website: str | None = None


@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
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
        raise HTTPException(status_code=404, detail="Profile not found.")
    return dict(row)


@router.put("/me")
async def update_my_profile(
    body: ArtistProfileUpdate | BusinessProfileUpdate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
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
            raise HTTPException(status_code=400, detail="Profile type mismatch.")
    return {"message": "Profile updated."}


@router.get("/artist/{user_id}")
async def get_artist_profile(user_id: str):
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT display_name, bio, category, skills, location, portfolio_url, instagram, gig_count FROM artist_profiles WHERE user_id = $1",
            user_id,
        )
    if not row:
        raise HTTPException(status_code=404, detail="Artist not found.")
    return dict(row)


async def _regenerate_artist_embedding(user_id: str, profile: ArtistProfileUpdate):
    try:
        embedding = await embed_artist_profile({
            "display_name": profile.display_name,
            "bio": profile.bio,
            "category": profile.category,
            "skills": profile.skills,
            "location": profile.location,
        })
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
