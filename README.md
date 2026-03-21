# Good Neighbors
https://amusing-joy-production-3473.up.railway.app/business

> Connecting Philly creators with local businesses — matched by vibe, not keywords.

Good Neighbors is a hyperlocal creator marketplace for Philadelphia. Artists, musicians, photographers, muralists, and content creators can discover gig opportunities with local businesses — and businesses can find the right creative talent — all ranked by AI-powered vibe matching, not just keyword search.

---

## What It Does

- **Creators** build a profile (bio, skills, category) and browse gigs matched to their vibe
- **Businesses** post gigs and discover creators ranked by AI similarity scores
- **Matching** is powered by Google Gemini embeddings + pgvector cosine similarity — no keyword guessing
- **Applying** is one click — all the info is in the profile, no forms, no friction

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + Vite + Tailwind CSS | Fast to build, clean UI |
| Backend | Python + FastAPI | Async, fast to ship, great ecosystem |
| Database | PostgreSQL + pgvector | Reliable, free tier (Railway/Render), vector search built-in |
| Auth | FastAPI + JWT + bcrypt | Clean, no third-party lock-in |
| AI Matching | Google Gemini embeddings (`gemini-embedding-001`) | 3072-dim semantic vectors |
| Deployment | Railway (backend + postgres + frontend) | Zero-config deploys, auto-redeploy on push |

---

## Project Structure

```
good-neighbors/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── routes/
│   │   ├── auth.py          # signup, login, logout
│   │   ├── profiles.py      # artist + business profiles
│   │   ├── gigs.py          # post, list, manage gigs
│   │   ├── applications.py  # apply to gigs, view applicants
│   │   └── match.py         # AI matching endpoints
│   ├── db/
│   │   ├── connection.py    # PostgreSQL connection pool
│   │   └── schema.sql       # full DB schema with pgvector
│   ├── services/
│   │   ├── auth.py          # JWT creation, password hashing
│   │   ├── embeddings.py    # Gemini embedding generation
│   │   └── matching.py      # cosine similarity queries
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── ProfileSetup.jsx
│   │   │   ├── ArtistFeed.jsx
│   │   │   ├── BusinessDashboard.jsx
│   │   │   └── PostGig.jsx
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   └── lib/
│   │       └── auth.js      # auth context + localStorage helpers
│   └── index.html
└── docs/
    └── api.md               # API reference
```

---

## Core Features (Beta)

- [x] AI-powered gig matching (embeddings + pgvector)
- [x] User signup / login (JWT, no third-party auth)
- [x] Artist profile (bio, skills, category, location, gig count)
- [x] Business profile (name, description, industry)
- [x] Post a gig (title, category, pay, date, location)
- [x] Browse matched gigs (artist view)
- [x] Browse matched creators (business view)
- [x] One-click apply (no forms, profile speaks for itself)
- [x] View applicants + contact handoff
- [x] Deploy (Railway — backend + postgres + frontend)
- [x] Dark / light mode toggle
- [ ] Profile edit Option

## Beyond MVP — Roadmap

- [ ] Public profile view page (`/profile/:id`)
- [ ] In-app messaging between artists and businesses
- [ ] Notifications (new match, new applicant, application accepted)
- [ ] Artist portfolio / media uploads (images, links)
- [ ] Business reviews / ratings for artists after a gig
- [ ] Gig status flow (open → in review → filled → completed)
- [ ] Artist gig count auto-increment on first completed gig
- [ ] Search + filter gigs by category, location, pay
- [ ] Admin dashboard (flag users, manage gigs)
- [ ] Mobile-responsive polish + PWA support

---
## Checklist Flaws
- [x] multi-selector when signing up
<img width="1664" height="852" alt="image" src="https://github.com/user-attachments/assets/efd1950a-dd84-456d-ac62-7b7dc7b329cb" />


---

## Getting Started

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your keys
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
```
# backend/.env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
GOOGLE_API_KEY=your-gemini-key
```

---

## License

MIT — see [LICENSE](LICENSE)

---

Built at the Philly Hackathon 2026. Now going further.
