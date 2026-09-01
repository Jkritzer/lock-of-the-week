import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentParticipant } from "@/lib/identity";

export async function POST(req: Request) {
  const participant = await getCurrentParticipant();
  if (!participant) {
    return NextResponse.json({ error: "Pick a name first" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const gameId = body?.gameId;
  const pickedTeam = body?.pickedTeam;
  if (typeof gameId !== "string" || typeof pickedTeam !== "string") {
    return NextResponse.json({ error: "gameId and pickedTeam are required" }, { status: 400 });
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  if (game.commenceTime <= new Date()) {
    return NextResponse.json({ error: "That game has already kicked off" }, { status: 400 });
  }
  if (pickedTeam !== game.homeTeam && pickedTeam !== game.awayTeam) {
    return NextResponse.json({ error: "pickedTeam must match one of the game's teams" }, { status: 400 });
  }
  if (game.homeSpread === null) {
    return NextResponse.json({ error: "No spread available for this game yet" }, { status: 400 });
  }

  const existingPick = await prisma.pick.findUnique({
    where: { participantId_weekId: { participantId: participant.id, weekId: game.weekId } },
    include: { game: true },
  });
  if (existingPick && existingPick.game.commenceTime <= new Date()) {
    return NextResponse.json(
      { error: "Your pick for this week is already locked in" },
      { status: 409 },
    );
  }

  const spreadAtPick = pickedTeam === game.homeTeam ? game.homeSpread : -game.homeSpread;

  const pick = await prisma.pick.upsert({
    where: { participantId_weekId: { participantId: participant.id, weekId: game.weekId } },
    update: {
      gameId: game.id,
      pickedTeam,
      spreadAtPick,
      submittedAt: new Date(),
      result: "PENDING",
      coverMargin: null,
    },
    create: {
      participantId: participant.id,
      weekId: game.weekId,
      gameId: game.id,
      pickedTeam,
      spreadAtPick,
    },
    include: { game: true },
  });

  return NextResponse.json({ pick });
}
