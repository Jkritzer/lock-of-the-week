import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { gradePick } from "@/lib/scoring";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";

// Backfill for games that finished while the scheduled GitHub workflow was
// disabled (Nov 2-10, 2026). The Odds API scores endpoint only looks back a
// few days, so grade-week can never resolve those games. This route resolves
// stuck games from ESPN's public scoreboard instead, matched by team names
// and commence date, then grades picks with the same gradePick logic.
// Safe to re-run: only SCHEDULED games older than the Odds API window are
// touched; picks and spreads are never modified.

const STUCK_GAME_CUTOFF_DAYS = 3.5;
const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard";

function normalizeTeamName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** YYYYMMDD in America/New_York, matching ESPN's dates= parameter. */
function easternDateKey(date: Date): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}${parts.month}${parts.day}`;
}

type EspnCompetitor = {
  homeAway: "home" | "away";
  team: { displayName: string };
  score: string;
};

type EspnEvent = {
  id: string;
  date: string;
  status: { type: { completed: boolean } };
  competitions: { competitors: EspnCompetitor[] }[];
};

async function fetchEspnEvents(dateKey: string): Promise<EspnEvent[]> {
  const res = await fetch(`${ESPN_SCOREBOARD_URL}?dates=${dateKey}&limit=200`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`ESPN scoreboard request failed for ${dateKey}: ${res.status}`);
  }
  const data = await res.json();
  return data.events ?? [];
}

function findGameResult(
  events: EspnEvent[],
  homeTeam: string,
  awayTeam: string,
): { homeScore: number; awayScore: number } | null {
  const home = normalizeTeamName(homeTeam);
  const away = normalizeTeamName(awayTeam);
  for (const event of events) {
    if (!event.status?.type?.completed) continue;
    const competitors = event.competitions?.[0]?.competitors ?? [];
    const homeEntry = competitors.find((c) => c.homeAway === "home");
    const awayEntry = competitors.find((c) => c.homeAway === "away");
    if (!homeEntry || !awayEntry) continue;
    if (
      normalizeTeamName(homeEntry.team.displayName) !== home ||
      normalizeTeamName(awayEntry.team.displayName) !== away
    ) {
      continue;
    }
    const homeScore = Number(homeEntry.score);
    const awayScore = Number(awayEntry.score);
    if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) continue;
    return { homeScore, awayScore };
  }
  return null;
}

export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - STUCK_GAME_CUTOFF_DAYS * 24 * 60 * 60 * 1000);
  const stuckGames = await prisma.game.findMany({
    where: { status: "SCHEDULED", commenceTime: { lt: cutoff } },
    include: { picks: true },
    orderBy: { commenceTime: "asc" },
  });

  if (stuckGames.length === 0) {
    return NextResponse.json({ gamesFinalized: 0, picksGraded: 0, matched: [], unmatched: [] });
  }

  const dateKeys = [...new Set(stuckGames.map((g) => easternDateKey(g.commenceTime)))];
  const eventsByDate = new Map<string, EspnEvent[]>();
  for (const dateKey of dateKeys) {
    eventsByDate.set(dateKey, await fetchEspnEvents(dateKey));
  }

  let gamesFinalized = 0;
  let picksGraded = 0;
  const matched: { game: string; score: string }[] = [];
  const unmatched: { game: string; commenceTime: Date }[] = [];

  for (const game of stuckGames) {
    const label = `${game.awayTeam} at ${game.homeTeam}`;
    const events = eventsByDate.get(easternDateKey(game.commenceTime)) ?? [];
    const result = findGameResult(events, game.homeTeam, game.awayTeam);
    if (!result) {
      unmatched.push({ game: label, commenceTime: game.commenceTime });
      continue;
    }

    await prisma.game.update({
      where: { id: game.id },
      data: { status: "FINAL", homeScore: result.homeScore, awayScore: result.awayScore },
    });
    gamesFinalized++;

    if (game.homeSpread !== null) {
      for (const pick of game.picks) {
        const { result: pickResult, coverMargin } = gradePick({
          pickedTeam: pick.pickedTeam,
          spreadAtPick: pick.spreadAtPick,
          homeTeam: game.homeTeam,
          homeScore: result.homeScore,
          awayScore: result.awayScore,
        });
        await prisma.pick.update({
          where: { id: pick.id },
          data: { result: pickResult, coverMargin },
        });
        picksGraded++;
      }
    }
    matched.push({ game: label, score: `${result.awayScore}-${result.homeScore}` });
  }

  return NextResponse.json({ gamesFinalized, picksGraded, matched, unmatched });
}
