import { NextResponse } from "next/server";
import { getStandings } from "@/lib/leaderboard";

export async function GET() {
  const standings = await getStandings();
  return NextResponse.json({ standings });
}
