import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateCurrentWeek } from "@/lib/week";

export async function GET() {
  const week = await getOrCreateCurrentWeek();

  const games = await prisma.game.findMany({
    where: { weekId: week.id },
    orderBy: { commenceTime: "asc" },
  });

  return NextResponse.json({ week, games });
}
