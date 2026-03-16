# ─── What this file does ──────────────────────────────────────────────────────
# This file handles the security logic for authentication. Two things:
#
# 1. PASSWORD HASHING
#    We never store plain passwords in the database — that would be a disaster
#    if we ever got hacked. Instead we "hash" them: run them through a one-way
#    algorithm (bcrypt) that turns "mypassword123" into a scrambled string like
#    "$2b$12$eImiTXuWVxfM37uY4JANjQ...". You can check if a password matches
#    a hash, but you can't reverse the hash back to the original password.
#
# 2. JWT TOKENS
#    After login, instead of making the user send their password on every
#    request, we give them a "token" — a signed string that proves who they are.
#    JWT = JSON Web Token. It contains the user's ID and role, and is signed
#    with our secret key so nobody can fake one.
#
#    Flow: User logs in → we give them a token → they send the token on every
#    future request → we verify the signature and trust the contents.
# ──────────────────────────────────────────────────────────────────────────────

import os
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# bcrypt is the gold standard for password hashing — deliberately slow to
# make brute-force attacks impractical
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTPBearer reads the "Authorization: Bearer <token>" header from requests
bearer_scheme = HTTPBearer()

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 72  # tokens last 3 days


# ─── Passwords ────────────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    """Turn a plain password into a bcrypt hash for safe storage."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Check if a plain password matches a stored hash. Returns True/False."""
    return pwd_context.verify(plain, hashed)


# ─── JWT Tokens ───────────────────────────────────────────────────────────────

def create_token(user_id: str, role: str) -> str:
    """
    Create a signed JWT token containing the user's ID and role.
    This token is what the frontend stores and sends on every API request.
    """
    payload = {
        "sub": user_id,           # "sub" = subject, standard JWT field for user ID
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """
    Verify and decode a JWT token. Raises an error if invalid or expired.
    Returns the payload dict with 'sub' (user_id) and 'role'.
    """
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")


# ─── Dependency ───────────────────────────────────────────────────────────────
# FastAPI "dependencies" are functions you inject into route handlers.
# Instead of writing auth logic in every route, you just add
# `current_user = Depends(get_current_user)` as a parameter and FastAPI
# calls this function automatically before your route runs.

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    Extracts and validates the JWT from the Authorization header.
    Returns {"user_id": "...", "role": "..."} if valid.
    Raises 401 if missing or invalid.
    """
    payload = decode_token(credentials.credentials)
    return {"user_id": payload["sub"], "role": payload["role"]}


def require_role(role: str):
    """
    Factory that creates a dependency requiring a specific role.
    Usage: Depends(require_role("business"))
    """
    def _check(user: dict = Depends(get_current_user)):
        if user["role"] != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Only {role} accounts can do this.",
            )
        return user
    return _check
