# VibeChecker

Personal vibe-based recommendation engine. Pick a content type, describe your mood, get a tailored recommendation.

## Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database**: Turso (libSQL) — local SQLite file in dev, Turso cloud in prod
- **AI**: OpenAI API (gpt-4o-mini) for vibe-based recommendations
- **APIs**: YouTube Data API v3, Jikan (MAL), Google OAuth

## Design

- **Aesthetic**: Minimalist, ethereal, soothing. Lilac, white, light grey only.
- **Background**: Dithered moving waves (canvas), mouse/touch reactive
- **Navigation**: Glowing orb at top center, reveals menu on tap
- **Main flow**: 3 separate screens — pick type → describe vibe → see recommendation
- **Icons**: Thin grey SVG outlines, no emojis in main UI
- **Mobile-first**: Everything must work and feel good on phones

## Key directories

- `src/app/` — Next.js pages and API routes
- `src/components/` — React components
- `src/lib/` — Database operations, AI engine, external integrations
- `src/types/` — Shared TypeScript types

## Commands

- `npm run dev` — local dev server (uses local SQLite, no Turso needed)
- `npm run build` — production build
- `npx tsc --noEmit` — type check

## Environment

See `.env.example` for all required variables. For local dev, only `OPENAI_API_KEY` is needed.

## Rating system

4-tier: "felt things" (with reasoning), "enjoyed", "watched", "not my thing" (with reasoning). Ratings feed directly into the recommendation prompt — loved content is prioritized, disliked content and reasoning is avoided.

## Imports

- **MAL**: Auto-import via Jikan API (username, no auth)
- **Letterboxd**: CSV paste from letterboxd.com/settings/data/ export
- **YouTube**: Google OAuth → import liked videos and subscriptions
- **Bulk**: Paste titles one per line
