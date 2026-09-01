import { prisma } from "@/lib/db";

export type StandingsRow = {
  participantId: string;
  name: string;
  wins: number;
  losses: number;
  pushes: number;
  totalCoverMargin: number;
};

export async function getStandings(): Promise<StandingsRow[]> {
  const participants = await prisma.participant.findMany({
    include: {
      picks: {
        where: { result: { not: "PENDING" } },
      },
    },
  });

  const standings = participants.map((p) => {
    const wins = p.picks.filter((pick) => pick.result === "WIN").length;
    const losses = p.picks.filter((pick) => pick.result === "LOSS").length;
    const pushes = p.picks.filter((pick) => pick.result === "PUSH").length;
    const totalCoverMargin = p.picks.reduce((sum, pick) => sum + (pick.coverMargin ?? 0), 0);

    return {
      participantId: p.id,
      name: p.name,
      wins,
      losses,
      pushes,
      totalCoverMargin,
    };
  });

  standings.sort((a, b) => {
    const net = b.wins - b.losses - (a.wins - a.losses);
    if (net !== 0) return net;
    return b.totalCoverMargin - a.totalCoverMargin;
  });

  return standings;
}
