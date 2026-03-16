# ─── What this file does ──────────────────────────────────────────────────────
# This file manages the connection between our backend and the PostgreSQL database.
#
# Key concept — "connection pool":
#   Opening a fresh database connection for every request is slow and expensive.
#   A pool keeps a set of connections open and ready, then hands them out to
#   requests as needed and takes them back when done. Think of it like a parking
#   garage — cars (requests) come in, grab a space (connection), do their thing,
#   and leave. The spaces stay there ready for the next car.
#
# We use `asyncpg` — an async PostgreSQL driver. The "async" part means our
# server can handle many requests at once without waiting for the DB to respond
# on each one before moving to the next.
# ──────────────────────────────────────────────────────────────────────────────

import os

import asyncpg
from dotenv import load_dotenv

load_dotenv()

# This holds our connection pool — starts as None, gets filled on startup
_pool: asyncpg.Pool | None = None


async def connect_db():
    """Called once at server startup to create the connection pool."""
    global _pool
    _pool = await asyncpg.create_pool(
        dsn=os.getenv("DATABASE_URL"),
        min_size=2,   # always keep 2 connections open
        max_size=10,  # never open more than 10 at once
    )
    print("Database connection pool created.")


async def disconnect_db():
    """Called once at server shutdown to close all connections cleanly."""
    global _pool
    if _pool:
        await _pool.close()
        print("Database connection pool closed.")


def get_pool() -> asyncpg.Pool:
    """
    Returns the pool so route handlers can borrow a connection.
    Usage in a route:
        async with get_pool().acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM users WHERE id = $1", user_id)
    """
    if _pool is None:
        raise RuntimeError("Database pool is not initialized. Did the server start correctly?")
    return _pool
