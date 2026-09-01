import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateCurrentWeek } from "@/lib/week";
import { fetchOdds, extractHomeSpread } from "@/lib/oddsApi";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";

export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const week = await getOrCreateCurrentWeek();
  const events = await fetchOdds({ commenceTimeFrom: week.startDate, commenceTimeTo: week.endDate });

  let synced = 0;
  let skippedNoSpread = 0;

  for (const event of events) {
    const homeSpread = extractHomeSpread(event);
    if (homeSpread === null) {
      skippedNoSpread++;
      continue;
    }

    await prisma.game.upsert({
      where: { oddsEventId: event.id },
      update: {
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        commenceTime: new Date(event.commence_time),
        homeSpread,
        lastSyncedAt: new Date(),
      },
      create: {
        weekId: week.id,
        oddsEventId: event.id,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        commenceTime: new Date(event.commence_time),
        homeSpread,
      },
    });
    synced++;
  }

  return NextResponse.json({
    week: { seasonYear: week.seasonYear, weekNumber: week.weekNumber },
    eventsFetched: events.length,
    synced,
    skippedNoSpread,
  });
}
