import { prisma } from "@/lib/db";

/**
 * A "week" runs Tuesday 00:00 UTC through the following Tuesday 00:00 UTC,
 * covering the Thu/Fri/Sat (and occasional Tue/Wed MACtion) CFB slate plus
 * Saturday/Monday games. Boundaries are computed in UTC for simplicity,
 * which puts the cutoff a few hours off from US midnight — fine for a
 * casual pick'em, not meant to be exact to the minute.
 */
export function getWeekWindow(date: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sun ... 2 = Tue ... 6 = Sat
  const daysSinceTuesday = (day - 2 + 7) % 7;

  const start = new Date(d);
  start.setUTCDate(d.getUTCDate() - daysSinceTuesday);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);

  return { start, end };
}

/** Finds the Week row for the given window, creating it (with the next sequential weekNumber) if missing. */
export async function getOrCreateCurrentWeek(date: Date = new Date()) {
  const { start, end } = getWeekWindow(date);

  const existing = await prisma.week.findFirst({
    where: { startDate: start, endDate: end },
  });
  if (existing) return existing;

  const seasonYear = start.getUTCFullYear();
  const latest = await prisma.week.findFirst({
    where: { seasonYear },
    orderBy: { weekNumber: "desc" },
  });

  return prisma.week.create({
    data: {
      seasonYear,
      weekNumber: (latest?.weekNumber ?? 0) + 1,
      startDate: start,
      endDate: end,
    },
  });
}
