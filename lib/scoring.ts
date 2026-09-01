export type GradeInput = {
  pickedTeam: string;
  spreadAtPick: number;
  homeTeam: string;
  homeScore: number;
  awayScore: number;
};

export type GradeOutput = {
  result: "WIN" | "LOSS" | "PUSH";
  coverMargin: number;
};

/** Grades a pick against the spread it was made at. Positive coverMargin = covered by that many points. */
export function gradePick(input: GradeInput): GradeOutput {
  const pickedIsHome = input.pickedTeam === input.homeTeam;
  const pickedScore = pickedIsHome ? input.homeScore : input.awayScore;
  const opponentScore = pickedIsHome ? input.awayScore : input.homeScore;

  const margin = pickedScore + input.spreadAtPick - opponentScore;

  if (margin > 0) return { result: "WIN", coverMargin: margin };
  if (margin < 0) return { result: "LOSS", coverMargin: margin };
  return { result: "PUSH", coverMargin: 0 };
}
