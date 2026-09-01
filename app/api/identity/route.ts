import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setIdentityCookie, clearIdentityCookie } from "@/lib/identity";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const participantId = body?.participantId;
  if (typeof participantId !== "string") {
    return NextResponse.json({ error: "participantId is required" }, { status: 400 });
  }

  const participant = await prisma.participant.findUnique({ where: { id: participantId } });
  if (!participant) {
    return NextResponse.json({ error: "Unknown participant" }, { status: 404 });
  }

  await setIdentityCookie(participant.id);
  return NextResponse.json({ participant });
}

export async function DELETE() {
  await clearIdentityCookie();
  return NextResponse.json({ ok: true });
}
