# Lock of the Week

Each week, pick one college football game against the spread as your "lock." No login — pick your name from the roster, submit one pick per week, locked in at that game's kickoff. Spreads come from [The Odds API](https://the-odds-api.com); a season leaderboard tracks record + cover margin.

## Stack

- Next.js (App Router, TypeScript) + Tailwind
- Postgres via [Neon](https://neon.tech) (or any Postgres) + Prisma 7 (with the `@prisma/adapter-pg` driver adapter)
- Deployed on Vercel, with Vercel Cron for the odds/scores sync jobs

## Local setup

1. `npm install`
2. Create a Postgres database (e.g. a free [Neon](https://neon.tech) project) and grab its connection string.
3. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — your Postgres connection string
   - `ODDS_API_KEY` — your key from https://the-odds-api.com
   - `CRON_SECRET` — any random string (`openssl rand -hex 32`); used to authenticate cron requests
4. `npm run db:migrate` — applies the schema
5. `npm run db:seed` — seeds the participant roster (edit the list in `prisma/seed.ts` to add/remove people)
6. `npm run dev` — http://localhost:3000

## How it works

- **Weeks** run Tuesday–Monday (UTC), auto-created on first request each week — see `lib/week.ts`.
- **`/api/cron/sync-odds`** pulls this week's NCAAF games + spreads from The Odds API and upserts them.
- **Picking a game locks in the spread at that moment** (`spreadAtPick`) — it isn't re-priced later, even if the line moves.
- **A pick locks when its game kicks off.** Before that, you can switch to a different game.
- **`/api/cron/grade-week`** finds games past kickoff still marked `SCHEDULED`, checks The Odds API's scores endpoint, and once a game is `completed`, grades every pick against the spread it was made at (`lib/scoring.ts`).
- **Leaderboard** (`/leaderboard`) ranks by net wins (wins − losses), with total cover margin as the tiebreaker.
- **Identity** is a plain httpOnly cookie set when you tap your name — honor system, no passwords. "Not you?" clears it so someone else can pick on a shared device.

## Deploying to Vercel

1. Push this repo to GitHub, import it into Vercel.
2. Set `DATABASE_URL`, `ODDS_API_KEY`, and `CRON_SECRET` as environment variables in the Vercel project settings (Production).
3. `lib/cronAuth.ts` checks incoming cron requests for `Authorization: Bearer $CRON_SECRET`.

**Scheduling is handled by GitHub Actions, not Vercel Cron** — Vercel's free (Hobby) plan only allows cron jobs to run once a day, which is too infrequent for syncing spreads/scores during game weeks. `.github/workflows/cron.yml` instead calls the two cron routes on a real schedule (sync-odds every 6 hours, grade-week every 2 hours) via plain `curl`, authenticated with the same `CRON_SECRET`. That requires two things set on the GitHub repo (Settings → Secrets and variables → Actions):
   - Secret `CRON_SECRET` — same value as in Vercel
   - Variable `APP_URL` — your deployed URL, e.g. `https://lock-of-the-week-beta.vercel.app`

   You can also trigger it manually from the Actions tab (`workflow_dispatch`), or via `gh workflow run cron.yml`.

**Odds API quota:** the free plan is 500 requests/month. At this cadence, sync-odds costs ~120/month; grade-week only calls the API when there's a game past kickoff still unfinished, and skips any game older than 3 days (The Odds API's scores endpoint can't look back further anyway, so there's no point retrying it forever). Check usage anytime — every response from The Odds API includes an `x-requests-remaining` header.

## Adding/removing participants

Edit the `PARTICIPANTS` array in `prisma/seed.ts` and re-run `npm run db:seed` (upserts by name, so it's safe to re-run).
