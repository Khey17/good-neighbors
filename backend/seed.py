import asyncio
import uuid
import json
import db.connection as dbc
from services.auth import hash_password

async def main():
    await dbc.connect_db()
    pool = dbc.get_pool()
    
    # Check if we already have users
    async with pool.acquire() as conn:
        count = await conn.fetchval("SELECT COUNT(*) FROM users")
        if count > 0:
            print("Database already has data. Skipping seed.")
            return

        print("Seeding local database with mock data...")

        # Create business user
        b_id = str(uuid.uuid4())
        await conn.execute("INSERT INTO users (id, email, password, role) VALUES ($1, 'business@test.com', $2, 'business')", b_id, hash_password('password'))
        await conn.execute("INSERT INTO business_profiles (user_id, business_name, industry) VALUES ($1, 'The Philly Cafe', 'Restaurant')", b_id)

        # Create gigs
        g_id = str(uuid.uuid4())
        # mock embedding just array of 1536 zeros
        mock_emb = json.dumps([0.0]*1536)
        await conn.execute("""
            INSERT INTO gigs (id, business_id, title, description, category, pay, location, date, status, embedding)
            VALUES ($1, $2, 'Live Jazz Friday', 'Looking for a solo sax player', 'Live Music', '$200', 'Center City', '2026-05-01', 'open', $3::vector)
        """, g_id, b_id, mock_emb)

        # Create artists
        for i, name, cat in [
            (1, "Alex The Artist", "Visual Art"),
            (2, "Jazz Master J", "Live Music"),
            (3, "Philly Foodie", "Food Influencer")
        ]:
            a_id = str(uuid.uuid4())
            await conn.execute("INSERT INTO users (id, email, password, role) VALUES ($1, $2, $3, 'artist')", a_id, f"artist{i}@test.com", hash_password('password'))
            await conn.execute("INSERT INTO artist_profiles (user_id, display_name, category, skills, embedding, gig_count) VALUES ($1, $2, $3, $4, $5::vector, $6)", 
                a_id, name, cat, ['fun', 'local'], mock_emb, i)

        print("Done! Created 1 Business + 1 Gig, and 3 Artists.")
        print("You can log in with business@test.com or artist1@test.com (Password: password) to test locally!")

if __name__ == '__main__':
    asyncio.run(main())
