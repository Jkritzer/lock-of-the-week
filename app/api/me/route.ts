import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentParticipant } from "@/lib/identity";
import { getWeekWindow } from "@/lib/week";

export async function GET() {
  const participant = await getCurrentParticipant();
  if (!participant) {
    return NextResponse.json({ participant: null, pick: null });
  }

  const { start, end } = getWeekWindow();
  const week = await prisma.week.findFirst({ where: { startDate: start, endDate: end } });

  const pick = week
    ? await prisma.pick.findUnique({
        where: { participantId_weekId: { participantId: participant.id, weekId: week.id } },
        include: { game: true },
      })
    : null;

  return NextResponse.json({ participant, pick });
}
