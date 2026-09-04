import teamShortNames from "./team-short-names.json";
import { resolveTeamKey } from "./teamNameLookup";

/** Looks up a team's school name without its mascot (e.g. "Notre Dame" for "Notre Dame Fighting Irish"). */
export function getTeamShortName(name: string): string {
  const key = resolveTeamKey(name);
  return (teamShortNames as Record<string, string>)[key] ?? name;
}
