import { prisma } from "@/lib/db";

/**
 * A "week" is bucketed Tuesday 00:00 UTC through the following Tuesday
 * 00:00 UTC — this just groups games into a Week row (used by the odds
 * sync) and covers the Thu/Fri/Sat (plus occasional Tue/Wed MACtion and
 * Sun/Mon) CFB slate. It is NOT when the week actually ends for picking —
 * see getOrCreateCurrentWeek, which only advances past a week once its
 * last game has actually kicked off and the next morning has arrived.
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

/**
 * Finds the Week that should currently be shown for picking, creating weeks
 * as needed. A week doesn't hand off to the next one at its fixed calendar
 * boundary — a Monday night game would still be live when that boundary
 * hits — it hands off at 8am Eastern the day after its last-kicking-off
 * game (falling back to the calendar boundary if it has no games yet).
 */
export async function getOrCreateCurrentWeek(date: Date = new Date()) {
  // Start from the latest week that's already begun (by the DB, not a freshly
  // computed calendar window) — recomputing the window straight from `date`
  // would jump straight past a week whose UTC calendar boundary has passed
  // even though its last game (by our own transition rule) hasn't.
  let week = await prisma.week.findFirst({
    where: { startDate: { lte: date } },
    orderBy: { startDate: "desc" },
  });

  if (!week) {
    const { start, end } = getWeekWindow(date);
    week = await findOrCreateWeekForWindow(start, end);
  }

  while (date >= (await resolveWeekTransitionTime(week))) {
    const { start, end } = getWeekWindow(week.endDate);
    week = await findOrCreateWeekForWindow(start, end);
  }

  return week;
}

async function findOrCreateWeekForWindow(start: Date, end: Date) {
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

/** The instant a week stops being "current": 8am ET the day after its last game kicks off. */
async function resolveWeekTransitionTime(week: { id: string; endDate: Date }): Promise<Date> {
  const lastGame = await prisma.game.findFirst({
    where: { weekId: week.id },
    orderBy: { commenceTime: "desc" },
  });
  if (!lastGame) return week.endDate;

  return next8amEastern(lastGame.commenceTime);
}

/** The next 8:00 AM America/New_York after the given instant, as a UTC Date (handles EDT/EST). */
function next8amEastern(after: Date): Date {
  const dayAfter = new Date(after.getTime() + 24 * 60 * 60 * 1000);
  const dateFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(dateFmt.formatToParts(dayAfter).map((p) => [p.type, p.value]));
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);

  const offsetFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "shortOffset",
  });
  const noonGuessUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const offsetLabel = offsetFmt.formatToParts(noonGuessUtc).find((p) => p.type === "timeZoneName")!.value;
  const offsetHours = Number(offsetLabel.replace("GMT", "")); // -4 (EDT) or -5 (EST)

  return new Date(Date.UTC(year, month - 1, day, 8 - offsetHours, 0, 0));
}
