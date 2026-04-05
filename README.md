# VibeChecker

A personal vibe-based recommendation engine. Pick what you want to watch, describe your mood, and get a tailored recommendation with screencaps, actors, and Reddit reviews.

## Features

- **Vibe-based recommendations** — describe your mood, get a perfect match
- **5 content types** — Movies, TV Shows, Anime, YouTube, Substack
- **Smart matching** — uses your ratings, interests, and "felt things" reasoning to understand your taste
- **TMDB integration** — real posters and screencaps from movies/TV/anime
- **Reddit reviews** — quality-filtered comments about recommended content
- **Watch progress tracking** — track episodes, seasons, timestamps
- **Drag-and-drop** — long-press cards to change status (Todo/In Progress/On Hold/Completed)
- **Rating system** — 4-tier: felt things, enjoyed, watched, not my thing (with optional reasoning)
- **Imports** — MyAnimeList, YouTube (OAuth), Letterboxd (CSV), bulk paste
- **Ethereal UI** — dithered wave background, floating moon navigation, glassmorphism

## Why this exists

You finally have free time. You're on the couch, food's ready, and you open Netflix. Then YouTube. Then your anime list. Then back to Netflix. 20 minutes later you're still scrolling, the food's cold, and you've watched nothing.

**VibeChecker fixes that.** You tell it how you feel, and it picks for you — based on what you actually love, not what's trending.

### Scenarios

**"I'm eating lunch, want something light"**
→ Pick YouTube → type "eating, something light and fun, 15 mins" → get a specific video that matches your humor and interests

**"Cozy Sunday, want to feel something"**
→ Pick Movie → "rainy day, wrapped in blanket, want to cry a little" → get a film recommendation based on what made you feel things before, with Reddit reviews to confirm it's worth it

**"Can't sleep, need background noise"**
→ Pick TV Show → "falling asleep, nothing too intense, familiar vibes" → get a comfort show suggestion with episode info

**"I want to learn something interesting"**
→ Pick Substack → "curious, want something thought-provoking about society or philosophy" → get a specific article recommendation matched to your interests

**"I have the whole evening free"**
→ Pick Anime → "binge mode, something gripping that I won't be able to stop watching" → get an anime matched to your taste profile with screencaps and actor info

The more you rate things and add interests, the better it knows you.

## Setup

### 1. Clone and install

```bash
git clone https://github.com/lunaticomic-vc/vibechecker.git
cd vibechecker
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your keys:

| Variable | Required | Where to get it |
|----------|----------|-----------------|
| `OPENAI_API_KEY` | Yes | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `TMDB_API_KEY` | Recommended | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) (free) |
| `YOUTUBE_API_KEY` | Optional | Google Cloud Console > YouTube Data API v3 |
| `MAL_CLIENT_ID` | Optional | [myanimelist.net/apiconfig](https://myanimelist.net/apiconfig) |
| `GOOGLE_CLIENT_ID` | Optional | Google Cloud Console > OAuth 2.0 (for YouTube import) |
| `GOOGLE_CLIENT_SECRET` | Optional | Same as above |
| `TURSO_DATABASE_URL` | For deploy | [turso.tech](https://turso.tech) (free tier) |
| `TURSO_AUTH_TOKEN` | For deploy | Same as above |
| `NEXT_PUBLIC_BASE_URL` | For deploy | Your Vercel URL |

**For local dev, only `OPENAI_API_KEY` is required.** Everything else enhances the experience but isn't needed to run.

### 3. Run locally

```bash
npm run dev
```

Open [https://localhost:3000](https://localhost:3000) (uses HTTPS by default).

Local dev uses a SQLite file (`vibechecker.db`) — no Turso needed.

### 4. Deploy to Vercel

#### Set up Turso database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash
turso auth signup  # or: turso auth login

# Create database
turso db create vibechecker
turso db show vibechecker --url         # copy as TURSO_DATABASE_URL
turso db tokens create vibechecker      # copy as TURSO_AUTH_TOKEN
```

#### Deploy

1. Push to GitHub (already done if you cloned this)
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo
3. Add all environment variables from the table above
4. Deploy

#### Google OAuth redirect URIs

If using YouTube import, add these redirect URIs in Google Cloud Console:

- `https://your-app.vercel.app/api/auth/google/callback`

## Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database**: Turso (libSQL) — local SQLite in dev, cloud in prod
- **AI**: OpenAI API (gpt-4o-mini) for vibe-based recommendations
- **Images**: TMDB API for posters and screencaps
- **APIs**: YouTube Data API, Jikan/MAL API, Reddit JSON API

## Project structure

```
src/
  app/
    page.tsx          # Home — content type selector + vibe flow
    movies/           # Movies library with status tabs
    tv/               # TV shows library
    anime/            # Anime library
    youtube/          # YouTube saved videos/channels
    substack/         # Substack articles
    progress/         # Currently watching (in progress only)
    interests/        # Global interests that feed into recommendations
    settings/         # Import integrations (MAL, YouTube, Letterboxd)
    api/              # API routes
  components/
    Header.tsx        # Moon navigation with glass pill dropdown
    Particles.tsx     # Dithered wave background
    ContentTypeSelector.tsx
    VibeInput.tsx
    RecommendationCard.tsx
    FloatingCircle.tsx
    RatingSelector.tsx
    StatusDragOverlay.tsx  # Drag-and-drop status change
    favorites/        # FavoriteCard, AddFavoriteForm
    progress/         # ProgressCard
  lib/
    db.ts             # Turso/SQLite database
    recommendation-engine.ts
    openai.ts
    tmdb.ts           # Movie/TV images
    reddit.ts         # Reddit review comments
    youtube.ts        # YouTube search
    mal.ts            # MyAnimeList import
    letterboxd.ts     # Letterboxd CSV parser
    favorites.ts      # CRUD operations
    progress.ts       # Watch progress tracking
    ratings.ts        # Rating system
    interests.ts      # Not yet — uses API route directly
    google-auth.ts    # YouTube OAuth
    external-links.ts # sflix, YouTube, MAL URLs
    logger.ts         # Dev server logging
  types/
    index.ts          # Shared TypeScript types
```
