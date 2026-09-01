import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const participants = await prisma.participant.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ participants });
}
