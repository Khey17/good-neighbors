-- Good Neighbors — PostgreSQL schema
-- Run once on a fresh database: psql $DATABASE_URL -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ─── Users ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,               -- bcrypt hash
    role        TEXT NOT NULL CHECK (role IN ('artist', 'business')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Artist Profiles ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS artist_profiles (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name    TEXT NOT NULL,
    bio             TEXT,
    category        TEXT,                    -- e.g. "Food Influencer", "Muralist"
    skills          TEXT[],                  -- e.g. {"photography","editing"}
    location        TEXT,
    portfolio_url   TEXT,
    portfolio_media TEXT[] DEFAULT '{}',
    instagram       TEXT,
    gig_count       INT DEFAULT 0,           -- incremented when a gig is completed
    embedding       VECTOR(1536),            -- Gemini embedding
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Business Profiles ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS business_profiles (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    business_name   TEXT NOT NULL,
    description     TEXT,
    industry        TEXT,
    location        TEXT,
    website         TEXT,
    portfolio_media TEXT[] DEFAULT '{}',
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Gigs ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gigs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    category        TEXT,
    pay             TEXT,
    location        TEXT,
    date            TEXT,
    status          TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'filled')),
    embedding       VECTOR(1536),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Applications ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS applications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id          UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    artist_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'accepted', 'rejected')),
    applied_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (gig_id, artist_id)               -- one application per gig per artist
);

-- ─── Matching Functions ───────────────────────────────────────────────────────

-- Top gigs for an artist
CREATE OR REPLACE FUNCTION match_gigs(
    query_embedding VECTOR(1536),
    match_count     INT DEFAULT 10
)
RETURNS TABLE (
    id          UUID,
    business_id UUID,
    title       TEXT,
    category    TEXT,
    description TEXT,
    pay         TEXT,
    date        TEXT,
    location    TEXT,
    match_score FLOAT
)
LANGUAGE SQL STABLE AS $$
    SELECT
        g.id,
        g.business_id,
        g.title,
        g.category,
        g.description,
        g.pay,
        g.date,
        g.location,
        1 - (g.embedding <=> query_embedding) AS match_score
    FROM gigs g
    WHERE g.status = 'open'
      AND g.embedding IS NOT NULL
    ORDER BY g.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Top artists for a gig
CREATE OR REPLACE FUNCTION match_artists(
    query_embedding VECTOR(1536),
    match_count     INT DEFAULT 10
)
RETURNS TABLE (
    user_id         UUID,
    display_name    TEXT,
    category        TEXT,
    skills          TEXT[],
    location        TEXT,
    gig_count       INT,
    match_score     FLOAT
)
LANGUAGE SQL STABLE AS $$
    SELECT
        ap.user_id,
        ap.display_name,
        ap.category,
        ap.skills,
        ap.location,
        ap.gig_count,
        1 - (ap.embedding <=> query_embedding) AS match_score
    FROM artist_profiles ap
    WHERE ap.embedding IS NOT NULL
    ORDER BY ap.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_gigs_business    ON gigs(business_id);
CREATE INDEX IF NOT EXISTS idx_gigs_status      ON gigs(status);
CREATE INDEX IF NOT EXISTS idx_applications_gig ON applications(gig_id);
CREATE INDEX IF NOT EXISTS idx_applications_artist ON applications(artist_id);
