import { prisma } from "@/lib/db";
import { getOrCreateCurrentWeek } from "@/lib/week";
import { getCurrentParticipant } from "@/lib/identity";
import { getTeamLogo } from "@/lib/teamLogos";
import PickBoard from "@/components/PickBoard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const week = await getOrCreateCurrentWeek();
  const [games, participants, currentParticipant, weekPicks] = await Promise.all([
    prisma.game.findMany({ where: { weekId: week.id }, orderBy: { commenceTime: "asc" } }),
    prisma.participant.findMany({ orderBy: { name: "asc" } }),
    getCurrentParticipant(),
    prisma.pick.findMany({ where: { weekId: week.id }, include: { participant: true } }),
  ]);
  const takenByTeam = new Map(weekPicks.map((p) => [`${p.gameId}:${p.pickedTeam}`, p.participant.name]));

  const currentPick = currentParticipant
    ? await prisma.pick.findUnique({
        where: { participantId_weekId: { participantId: currentParticipant.id, weekId: week.id } },
      })
    : null;

  return (
    <PickBoard
      weekLabel={`Week ${week.weekNumber} · ${week.seasonYear}`}
      participants={participants.map((p) => ({ id: p.id, name: p.name }))}
      games={games.map((g) => ({
        id: g.id,
        homeTeam: g.homeTeam,
        awayTeam: g.awayTeam,
        commenceTime: g.commenceTime.toISOString(),
        homeSpread: g.homeSpread,
        status: g.status,
        awayLogo: getTeamLogo(g.awayTeam),
        homeLogo: getTeamLogo(g.homeTeam),
        awayPickedBy: takenByTeam.get(`${g.id}:${g.awayTeam}`) ?? null,
        homePickedBy: takenByTeam.get(`${g.id}:${g.homeTeam}`) ?? null,
      }))}
      initialParticipant={currentParticipant ? { id: currentParticipant.id, name: currentParticipant.name } : null}
      initialPick={
        currentPick
          ? {
              gameId: currentPick.gameId,
              pickedTeam: currentPick.pickedTeam,
              spreadAtPick: currentPick.spreadAtPick,
            }
          : null
      }
    />
  );
}
