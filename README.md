# VibeChecker ✧

*You finally have free time. You're on the couch, food's ready, and you open Netflix. Then YouTube. Then your anime list. Then back to Netflix. 20 minutes later you're still scrolling, the food's cold, and you've watched nothing.*

**VibeChecker takes the decision away.** You tell it how you feel — and it picks something perfect. A movie, a show, an anime, a YouTube video, or even an article to read. Based on what you actually love, not what's trending.

The more you use it, the more it understands your taste. Your ratings, your interests, the things that made you *feel* something — it remembers all of it.

---

### Imagine this

**You're eating lunch** — pick YouTube, type *"eating, something light, 15 mins"* → a niche video matched to your humor

**Cozy Sunday, want to feel something** — pick Movie, type *"rainy day, blanket, want to cry a little"* → a film you'll love, with Reddit reviews confirming it's worth it

**Can't sleep** — pick TV Show, type *"falling asleep, nothing intense"* → a comfort show suggestion with episode info

**Want to learn something** — pick Substack, type *"curious, thought-provoking"* → a specific article matched to your interests

**Whole evening free** — pick Anime, type *"binge, something I can't stop watching"* → an anime matched to your taste with screencaps

---

### What it does

- **Vibe-based AI recommendations** using your taste profile, ratings, and interests
- **5 content types** — Movies, TV Shows, Anime, YouTube, Substack
- **Real images** — TMDB posters and scene screencaps
- **Reddit reviews** — quality-filtered, spoiler-free opinions
- **Progress tracking** — episodes, seasons, timestamps, drag-and-drop status changes
- **Smart rating system** — *felt things*, *enjoyed*, *watched*, *not my thing* (with reasoning that feeds back into recommendations)
- **Imports** — MyAnimeList, YouTube OAuth, Letterboxd CSV
- **Interests** — global tags that shape all recommendations
- **Ethereal UI** — dithered wave background, floating moon navigation, glassmorphism

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/lunaticomic-vc/vibechecker.git
cd vibechecker
npm install
```

### 2. Set up your keys

```bash
cp .env.example .env
```

Open `.env` and add your keys:

| Key | Required? | What it does | Get it at |
|-----|-----------|-------------|-----------|
| `OPENAI_API_KEY` | **Yes** | Powers all recommendations | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `TMDB_API_KEY` | Recommended | Real movie/TV posters + screencaps | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) |
| `YOUTUBE_API_KEY` | Optional | YouTube video search | Google Cloud Console |
| `MAL_CLIENT_ID` | Optional | MyAnimeList import | [myanimelist.net/apiconfig](https://myanimelist.net/apiconfig) |
| `GOOGLE_CLIENT_ID` | Optional | YouTube liked videos import | Google Cloud Console > OAuth |
| `GOOGLE_CLIENT_SECRET` | Optional | Same | Same |

> For local development, only `OPENAI_API_KEY` is needed. Everything else enhances the experience but isn't required. Locally, the app uses a SQLite file — no cloud database setup needed.

### 3. Run it

```bash
npm run dev
```

Open [https://localhost:3000](https://localhost:3000)

---

## Stack

Next.js 14 · TypeScript · Tailwind CSS · Turso (libSQL) · OpenAI · TMDB · Reddit API

---

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Home — pick content + describe vibe
│   ├── movies/               # Movie library
│   ├── tv/                   # TV show library
│   ├── anime/                # Anime library
│   ├── youtube/              # YouTube saves
│   ├── substack/             # Article saves
│   ├── progress/             # Currently watching
│   ├── interests/            # Taste profile tags
│   ├── settings/             # Import integrations
│   └── api/                  # Backend routes
├── components/
│   ├── Header.tsx            # Moon + glass navigation
│   ├── Particles.tsx         # Wave background
│   ├── RecommendationCard.tsx
│   ├── StatusDragOverlay.tsx  # Drag-and-drop
│   └── ...
└── lib/
    ├── recommendation-engine.ts
    ├── tmdb.ts · reddit.ts · youtube.ts
    ├── mal.ts · letterboxd.ts
    ├── db.ts · favorites.ts · progress.ts · ratings.ts
    └── logger.ts
```
