# Consumption Corner

*You finally have free time. You're on the couch, food's ready, and you open Netflix. Then YouTube. Then your anime list. Then back to Netflix. 20 minutes later you're still scrolling, the food's cold, and you've watched nothing.*

**Consumption Corner takes the decision away.** You tell it how you feel — and it picks something perfect. A movie, a show, an anime, a K-drama, a YouTube video, or even an article to read. Based on what you actually love, not what's trending.

The more you use it, the more it understands your taste. Your ratings, your interests, the things that made you *feel* something — it remembers all of it.

---

### Imagine this

**You're eating lunch** — pick YouTube, type *"eating, something light and ~20 mins"* → a niche video matched to your humor

**Sleepover with friends** — pick Movie, type *"sleepover binge with the girls"* → a film you'll love, with spoiler-checked Reddit reviews

**Can't sleep** — pick K-Drama, type *"can't sleep, something cozy"* → a Korean drama with tropes and cast info

**Want to learn something** — pick Substack, type *"curious, thought-provoking"* → a specific article matched to your interests

**Whole evening free** — pick Anime, type *"procrastinating, make it unhinged"* → an anime matched to your taste with MAL posters and screencaps

---

### What it does

- **Vibe-based AI recommendations** using your taste profile, ratings, and interests
- **6 content types** — Movies, TV Shows, Anime, K-Drama, YouTube, Substack
- **Real images** — TMDB posters/screencaps for movies and TV, Jikan/MAL art for anime
- **Tropes** — shows prevalent narrative tropes (found family, enemies to lovers, slow burn, etc.)
- **Reddit reviews** — quality-filtered with AI spoiler detection before displaying
- **Auto-enrichment** — manually added titles get auto-populated with poster, year, description, and cast via TMDB/Jikan
- **Name & title autofix** — misspelled titles and people's names are auto-corrected via Brave search
- **Progress tracking** — episodes, seasons, timestamps, drag-and-drop status changes
- **People you love** — track favorite actors, directors, creators — recommendations prioritize their work
- **Smart rating system** — *felt things*, *enjoyed*, *watched*, *not my thing* (with reasoning that feeds back into recommendations)
- **Imports** — MyAnimeList, YouTube OAuth, Letterboxd CSV, bulk paste
- **Interests** — global tags that shape all recommendations
- **Ethereal UI** — dithered wave background, floating moon navigation, glassmorphism

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/lunaticomic-vc/consumptioncorner.git
cd consumptioncorner
npm install
```

### 2. Set up your keys

```bash
cp .env.example .env
```

Open `.env` and add your keys:

| Key | Required? | What it does | Get it at |
|-----|-----------|-------------|-----------|
| `OPENAI_API_KEY` | **Yes** | Powers all recommendations + spoiler detection | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `TMDB_API_KEY` | Recommended | Movie/TV posters, screencaps, cast info | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) |
| `BRAVE_API_KEY` | Recommended | Title autofix, people search, Substack articles | [brave.com/search/api](https://brave.com/search/api/) |
| `YOUTUBE_API_KEY` | Optional | YouTube video search | Google Cloud Console |
| `MAL_CLIENT_ID` | Optional | MyAnimeList import + anime images | [myanimelist.net/apiconfig](https://myanimelist.net/apiconfig) |
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

Next.js 14 · TypeScript · Tailwind CSS · Turso (libSQL) · OpenAI · TMDB · Jikan/MAL · Brave Search · Reddit API

---

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Home — pick content type + describe vibe
│   ├── movies/               # Movie library
│   ├── tv/                   # TV show library
│   ├── anime/                # Anime library
│   ├── kdrama/               # K-Drama library
│   ├── youtube/              # YouTube saves
│   ├── substack/             # Article saves
│   ├── progress/             # Current — pick up where you left off
│   ├── interests/            # Taste profile tags
│   ├── people/               # Favorite actors, directors, creators
│   ├── settings/             # Import integrations
│   └── api/                  # Backend routes
├── components/
│   ├── Header.tsx            # Moon + glass navigation
│   ├── Particles.tsx         # Wave background
│   ├── RecommendationCard.tsx # Rec display with spoiler-checked comments
│   ├── VibeInput.tsx         # Vibe prompt with example vibes
│   ├── StatusDragOverlay.tsx  # Drag-and-drop
│   └── ...
└── lib/
    ├── recommendation-engine.ts  # AI rec engine with taste profiles
    ├── tmdb.ts · reddit.ts · youtube.ts
    ├── mal.ts · letterboxd.ts · people.ts
    ├── autofix-title.ts      # Brave-powered title correction
    ├── db.ts · favorites.ts · progress.ts · ratings.ts
    └── logger.ts
```
