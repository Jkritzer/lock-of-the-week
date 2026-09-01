import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "low_participant_id";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function setIdentityCookie(participantId: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, participantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
}

export async function clearIdentityCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Returns the current participant based on the identity cookie, or null if unset/invalid. */
export async function getCurrentParticipant() {
  const store = await cookies();
  const id = store.get(COOKIE_NAME)?.value;
  if (!id) return null;
  return prisma.participant.findUnique({ where: { id } });
}
