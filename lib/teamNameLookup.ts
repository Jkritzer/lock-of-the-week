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

const COMBINING_MARKS = /[̀-ͯ]/g;

export function normalizeTeamName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .replace(/['’.]/g, "")
    .replace(/-/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Resolves an Odds-API-style team name to the key it's stored under in the ESPN-derived data files. */
export function resolveTeamKey(name: string): string {
  const key = normalizeTeamName(name);
  return ALIASES[key] ?? key;
}
