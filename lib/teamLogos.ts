import teamLogos from "./team-logos.json";

/**
 * The Odds API's team names occasionally differ from ESPN's `displayName`
 * (abbreviated vs. full state names, old vs. new school names, etc).
 * Keyed and valued by normalize()'d name.
 */
const ALIASES: Record<string, string> = {
  "appalachian state mountaineers": "app state mountaineers",
  "houston baptist huskies": "houston christian huskies",
  "liu sharks": "long island university sharks",
  "southeastern louisiana lions": "se louisiana lions",
  "youngstown st penguins": "youngstown state penguins",
  "citadel bulldogs": "the citadel bulldogs",
  albany: "ualbany great danes",
  "southern mississippi golden eagles": "southern miss golden eagles",
  "nicholls state colonels": "nicholls colonels",
  "sam houston state bearkats": "sam houston bearkats",
  "umass minutemen": "massachusetts minutemen",
};

const COMBINING_MARKS = /[\u0300-\u036f]/g;

function normalize(name: string): string {
  return name
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .replace(/['’.]/g, "")
    .replace(/-/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Looks up a team's logo URL by its Odds-API-style display name. Returns null if unknown. */
export function getTeamLogo(name: string): string | null {
  const key = normalize(name);
  const resolvedKey = ALIASES[key] ?? key;
  return (teamLogos as Record<string, string>)[resolvedKey] ?? null;
}
