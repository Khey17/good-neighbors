# ─── What this file does ──────────────────────────────────────────────────────
# This file defines the HTTP endpoints for authentication:
#   POST /api/auth/signup  — create a new account
#   POST /api/auth/login   — log into an existing account
#
# How it connects to other files:
#   - db/connection.py  → to read/write the `users` table in PostgreSQL
#   - services/auth.py  → to hash passwords and create JWT tokens
#
# What a "route" is:
#   A route is just a function that runs when a specific URL is hit.
#   @router.post("/signup") means: when someone sends a POST request to
#   /api/auth/signup, run the signup() function below.
#
# What Pydantic models are:
#   The SignUpRequest and LoginRequest classes define what the request body
#   must look like. FastAPI automatically validates incoming JSON against them
#   and returns a clear error if something is missing or wrong.
# ──────────────────────────────────────────────────────────────────────────────

from typing import Literal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

from db.connection import get_pool
from services.auth import hash_password, verify_password, create_token

router = APIRouter()


# ─── Request / Response shapes ────────────────────────────────────────────────

class SignUpRequest(BaseModel):
    email: EmailStr          # Pydantic validates this is a real email format
    password: str
    role: Literal["artist", "business"]   # only these two values are allowed
    display_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(body: SignUpRequest):
    """
    Create a new user account.
    Steps:
      1. Check the email isn't already taken
      2. Hash the password (never store it plain)
      3. Insert the new user row into PostgreSQL
      4. Return a JWT token so the user is immediately logged in
    """
    pool = get_pool()

    async with pool.acquire() as conn:
        # Check for duplicate email
        existing = await conn.fetchrow(
            "SELECT id FROM users WHERE email = $1", body.email
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )

        # Insert the new user — the DB generates the UUID automatically
        row = await conn.fetchrow(
            """
            INSERT INTO users (email, password, role)
            VALUES ($1, $2, $3)
            RETURNING id, email, role
            """,
            body.email,
            hash_password(body.password),
            body.role,
        )

        user_id = str(row["id"])

        # Create the matching profile row (artist or business)
        if body.role == "artist":
            await conn.execute(
                "INSERT INTO artist_profiles (user_id, display_name) VALUES ($1, $2)",
                user_id, body.display_name,
            )
        else:
            await conn.execute(
                "INSERT INTO business_profiles (user_id, business_name) VALUES ($1, $2)",
                user_id, body.display_name,
            )

    # Issue a token — user is now logged in
    token = create_token(user_id, body.role)

    return {
        "user_id": user_id,
        "email": body.email,
        "role": body.role,
        "display_name": body.display_name,
        "access_token": token,
    }


@router.post("/login")
async def login(body: LoginRequest):
    """
    Log into an existing account.
    Steps:
      1. Find the user by email
      2. Verify the password against the stored hash
      3. Return a fresh JWT token
    """
    pool = get_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, email, password, role FROM users WHERE email = $1",
            body.email,
        )

    # Use the same error for "not found" and "wrong password" —
    # never tell an attacker which one it was
    if not row or not verify_password(body.password, row["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    user_id = str(row["id"])

    # Fetch display name from the appropriate profile table
    async with pool.acquire() as conn:
        if row["role"] == "artist":
            profile = await conn.fetchrow(
                "SELECT display_name FROM artist_profiles WHERE user_id = $1", user_id
            )
        else:
            profile = await conn.fetchrow(
                "SELECT business_name AS display_name FROM business_profiles WHERE user_id = $1", user_id
            )

    display_name = profile["display_name"] if profile else body.email.split("@")[0]

    token = create_token(user_id, row["role"])

    return {
        "user_id": user_id,
        "email": body.email,
        "role": row["role"],
        "display_name": display_name,
        "access_token": token,
    }
