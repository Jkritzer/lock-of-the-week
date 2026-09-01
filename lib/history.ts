import { prisma } from "@/lib/db";

export type WeeklyPickRow = {
  participantId: string;
  name: string;
  pick: {
    pickedTeam: string;
    opponent: string;
    spreadAtPick: number;
    result: "PENDING" | "WIN" | "LOSS" | "PUSH";
    coverMargin: number | null;
  } | null;
};

export type WeeklyHistoryEntry = {
  weekId: string;
  seasonYear: number;
  weekNumber: number;
  rows: WeeklyPickRow[];
};

export async function getWeeklyHistory(): Promise<WeeklyHistoryEntry[]> {
  const [weeks, participants] = await Promise.all([
    prisma.week.findMany({
      orderBy: [{ seasonYear: "desc" }, { weekNumber: "desc" }],
      include: {
        picks: { include: { game: true } },
      },
    }),
    prisma.participant.findMany({ orderBy: { name: "asc" } }),
  ]);

  return weeks.map((week) => {
    const pickByParticipant = new Map(week.picks.map((p) => [p.participantId, p]));

    const rows: WeeklyPickRow[] = participants.map((participant) => {
      const pick = pickByParticipant.get(participant.id);
      if (!pick) return { participantId: participant.id, name: participant.name, pick: null };

      const opponent = pick.pickedTeam === pick.game.homeTeam ? pick.game.awayTeam : pick.game.homeTeam;

      return {
        participantId: participant.id,
        name: participant.name,
        pick: {
          pickedTeam: pick.pickedTeam,
          opponent,
          spreadAtPick: pick.spreadAtPick,
          result: pick.result,
          coverMargin: pick.coverMargin,
        },
      };
    });

    return {
      weekId: week.id,
      seasonYear: week.seasonYear,
      weekNumber: week.weekNumber,
      rows,
    };
  });
}
