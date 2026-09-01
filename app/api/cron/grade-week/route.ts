import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchScores } from "@/lib/oddsApi";
import { gradePick } from "@/lib/scoring";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";

const SCORES_LOOKBACK_DAYS = 3;

export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The Odds API's scores endpoint only looks back SCORES_LOOKBACK_DAYS days, so a game
  // older than that can never resolve through it — excluding it here stops us from making
  // a wasted API call every run just because one game never came back as completed.
  const pendingGames = await prisma.game.findMany({
    where: {
      status: "SCHEDULED",
      commenceTime: {
        lte: new Date(),
        gte: new Date(Date.now() - SCORES_LOOKBACK_DAYS * 24 * 60 * 60 * 1000),
      },
    },
    include: { picks: true },
  });

  if (pendingGames.length === 0) {
    return NextResponse.json({ gamesFinalized: 0, picksGraded: 0 });
  }

  const scores = await fetchScores(SCORES_LOOKBACK_DAYS);
  const scoresByEventId = new Map(scores.map((s) => [s.id, s]));

  let gamesFinalized = 0;
  let picksGraded = 0;

  for (const game of pendingGames) {
    const scoreEvent = scoresByEventId.get(game.oddsEventId);
    if (!scoreEvent?.completed || !scoreEvent.scores) continue;

    const homeScore = scoreEvent.scores.find((s) => s.name === game.homeTeam)?.score;
    const awayScore = scoreEvent.scores.find((s) => s.name === game.awayTeam)?.score;
    if (homeScore === undefined || awayScore === undefined) continue;

    const homeScoreNum = Number(homeScore);
    const awayScoreNum = Number(awayScore);

    await prisma.game.update({
      where: { id: game.id },
      data: { status: "FINAL", homeScore: homeScoreNum, awayScore: awayScoreNum },
    });
    gamesFinalized++;

    for (const pick of game.picks) {
      if (game.homeSpread === null) continue;
      const { result, coverMargin } = gradePick({
        pickedTeam: pick.pickedTeam,
        spreadAtPick: pick.spreadAtPick,
        homeTeam: game.homeTeam,
        homeScore: homeScoreNum,
        awayScore: awayScoreNum,
      });
      await prisma.pick.update({
        where: { id: pick.id },
        data: { result, coverMargin },
      });
      picksGraded++;
    }
  }

  return NextResponse.json({ gamesFinalized, picksGraded });
}
