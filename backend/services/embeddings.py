# ─── What this file does ──────────────────────────────────────────────────────
# Talks to Google Gemini to convert text into embeddings (lists of numbers).
#
# Why do we convert text to numbers?
#   Computers can't compare "jazz musician in South Philly" to "live music gig
#   in Rittenhouse" and know they're related. But if you convert both to 1536
#   numbers, you can measure how close they are mathematically. That distance
#   IS the similarity score. The model has learned from billions of texts what
#   words and concepts are related to each other.
#
# We build a single descriptive sentence from each profile/gig,
# then ask Gemini to embed it. One clean sentence works better than
# dumping raw JSON at the model.
# ──────────────────────────────────────────────────────────────────────────────

import os
import asyncio
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

EMBEDDING_MODEL = "models/gemini-embedding-001"


async def embed_text(text: str) -> list[float]:
    """
    Core function — sends text to Gemini, gets back a list of 1536 floats.
    We run it in a thread pool because the Gemini SDK is synchronous
    (blocking), and we don't want it to freeze our async server.
    """
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        lambda: genai.embed_content(model=EMBEDDING_MODEL, content=text)
    )
    return result["embedding"]


async def embed_artist_profile(profile: dict) -> list[float]:
    """
    Builds a descriptive sentence from an artist profile and embeds it.
    Example output sentence:
      "Josheatsphilly is a Food Influencer based in Philadelphia.
       Skills: restaurants, lifestyle, content creation.
       Bio: Philly-based food creator highlighting local gems."
    """
    skills = ", ".join(profile.get("skills") or [])
    parts = [
        f"{profile.get('display_name', '')} is a {profile.get('category', 'creator')}",
        f"based in {profile.get('location', 'Philadelphia')}.",
        f"Skills: {skills}." if skills else "",
        f"Bio: {profile.get('bio', '')}",
    ]
    text = " ".join(p for p in parts if p)
    return await embed_text(text)


async def embed_gig(gig: dict) -> list[float]:
    """
    Builds a descriptive sentence from a gig posting and embeds it.
    Example output sentence:
      "Live Music gig: Live Jazz for Saturday Brunch.
       Located in Rittenhouse Square. Pay: $300.
       Upscale brunch spot looking for a jazz trio..."
    """
    parts = [
        f"{gig.get('category', 'Creative')} gig: {gig.get('title', '')}.",
        f"Located in {gig.get('location')}." if gig.get("location") else "",
        f"Pay: {gig.get('pay')}." if gig.get("pay") else "",
        gig.get("description", ""),
    ]
    text = " ".join(p for p in parts if p)
    return await embed_text(text)
