import teamLogos from "./team-logos.json";
import { resolveTeamKey } from "./teamNameLookup";

/** Looks up a team's logo URL by its Odds-API-style display name. Returns null if unknown. */
export function getTeamLogo(name: string): string | null {
  const key = resolveTeamKey(name);
  return (teamLogos as Record<string, string>)[key] ?? null;
}
