const BASE_URL = "https://api.the-odds-api.com/v4/sports/americanfootball_ncaaf";

function apiKey(): string {
  const key = process.env.ODDS_API_KEY;
  if (!key) throw new Error("ODDS_API_KEY is not set");
  return key;
}

export type OddsApiOutcome = {
  name: string;
  price: number;
  point?: number;
};

export type OddsApiBookmaker = {
  key: string;
  title: string;
  markets: {
    key: string;
    outcomes: OddsApiOutcome[];
  }[];
};

export type OddsApiEvent = {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
};

export type OddsApiScoreEvent = {
  id: string;
  commence_time: string;
  completed: boolean;
  home_team: string;
  away_team: string;
  scores: { name: string; score: string }[] | null;
};

/** Fetches upcoming games + spread lines within a commence-time window. */
export async function fetchOdds(params: {
  commenceTimeFrom: Date;
  commenceTimeTo: Date;
}): Promise<OddsApiEvent[]> {
  const url = new URL(`${BASE_URL}/odds`);
  url.searchParams.set("apiKey", apiKey());
  url.searchParams.set("regions", "us");
  url.searchParams.set("markets", "spreads");
  url.searchParams.set("oddsFormat", "american");
  url.searchParams.set("dateFormat", "iso");
  url.searchParams.set("commenceTimeFrom", toIso(params.commenceTimeFrom));
  url.searchParams.set("commenceTimeTo", toIso(params.commenceTimeTo));

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Odds API odds request failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/** Fetches recent scores (API supports up to 3 days back). */
export async function fetchScores(daysFrom = 3): Promise<OddsApiScoreEvent[]> {
  const url = new URL(`${BASE_URL}/scores`);
  url.searchParams.set("apiKey", apiKey());
  url.searchParams.set("daysFrom", String(Math.min(Math.max(daysFrom, 1), 3)));
  url.searchParams.set("dateFormat", "iso");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Odds API scores request failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/** Picks a home-team spread point from the first bookmaker that has a spreads market. */
export function extractHomeSpread(event: OddsApiEvent): number | null {
  for (const bookmaker of event.bookmakers) {
    const market = bookmaker.markets.find((m) => m.key === "spreads");
    if (!market) continue;
    const homeOutcome = market.outcomes.find((o) => o.name === event.home_team);
    if (homeOutcome?.point !== undefined) return homeOutcome.point;
  }
  return null;
}

function toIso(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}
