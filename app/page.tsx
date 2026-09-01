import { prisma } from "@/lib/db";
import { getOrCreateCurrentWeek } from "@/lib/week";
import { getCurrentParticipant } from "@/lib/identity";
import PickBoard from "@/components/PickBoard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const week = await getOrCreateCurrentWeek();
  const [games, participants, currentParticipant] = await Promise.all([
    prisma.game.findMany({ where: { weekId: week.id }, orderBy: { commenceTime: "asc" } }),
    prisma.participant.findMany({ orderBy: { name: "asc" } }),
    getCurrentParticipant(),
  ]);

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
