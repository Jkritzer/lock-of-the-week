import { resolveTeamKey } from "./teamNameLookup";

export const CONFERENCES = ["SEC", "Big Ten", "ACC", "Big 12"] as const;
export type Conference = (typeof CONFERENCES)[number];

const MEMBERS: Record<Conference, string[]> = {
  SEC: [
    "Alabama Crimson Tide",
    "Arkansas Razorbacks",
    "Auburn Tigers",
    "Florida Gators",
    "Georgia Bulldogs",
    "Kentucky Wildcats",
    "LSU Tigers",
    "Mississippi State Bulldogs",
    "Missouri Tigers",
    "Ole Miss Rebels",
    "Oklahoma Sooners",
    "South Carolina Gamecocks",
    "Tennessee Volunteers",
    "Texas Longhorns",
    "Texas A&M Aggies",
    "Vanderbilt Commodores",
  ],
  "Big Ten": [
    "Illinois Fighting Illini",
    "Indiana Hoosiers",
    "Iowa Hawkeyes",
    "Maryland Terrapins",
    "Michigan Wolverines",
    "Michigan State Spartans",
    "Minnesota Golden Gophers",
    "Nebraska Cornhuskers",
    "Northwestern Wildcats",
    "Ohio State Buckeyes",
    "Oregon Ducks",
    "Penn State Nittany Lions",
    "Purdue Boilermakers",
    "Rutgers Scarlet Knights",
    "UCLA Bruins",
    "USC Trojans",
    "Washington Huskies",
    "Wisconsin Badgers",
  ],
  ACC: [
    "Boston College Eagles",
    "California Golden Bears",
    "Clemson Tigers",
    "Duke Blue Devils",
    "Florida State Seminoles",
    "Georgia Tech Yellow Jackets",
    "Louisville Cardinals",
    "Miami Hurricanes",
    "NC State Wolfpack",
    "North Carolina Tar Heels",
    "Pittsburgh Panthers",
    "SMU Mustangs",
    "Stanford Cardinal",
    "Syracuse Orange",
    "Virginia Cavaliers",
    "Virginia Tech Hokies",
    "Wake Forest Demon Deacons",
  ],
  "Big 12": [
    "Arizona Wildcats",
    "Arizona State Sun Devils",
    "Baylor Bears",
    "BYU Cougars",
    "UCF Knights",
    "Cincinnati Bearcats",
    "Colorado Buffaloes",
    "Houston Cougars",
    "Iowa State Cyclones",
    "Kansas Jayhawks",
    "Kansas State Wildcats",
    "Oklahoma State Cowboys",
    "TCU Horned Frogs",
    "Texas Tech Red Raiders",
    "Utah Utes",
    "West Virginia Mountaineers",
  ],
};

const TEAM_TO_CONFERENCE = new Map<string, Conference>();
for (const conference of CONFERENCES) {
  for (const team of MEMBERS[conference]) {
    TEAM_TO_CONFERENCE.set(resolveTeamKey(team), conference);
  }
}

/** Returns the Odds-API team's Power 4 conference, or null if it's not a SEC/Big Ten/ACC/Big 12 member. */
export function getTeamConference(name: string): Conference | null {
  return TEAM_TO_CONFERENCE.get(resolveTeamKey(name)) ?? null;
}
