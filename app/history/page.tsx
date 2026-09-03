import { getWeeklyHistory } from "@/lib/history";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const weeks = await getWeeklyHistory();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Picks by Week</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500 dark:text-zinc-400">Who picked what, every week of the season.</p>

      {weeks.length === 0 && <p className="text-zinc-500 dark:text-zinc-400">No weeks yet.</p>}

      <div className="flex flex-col gap-8">
        {weeks.map((week) => (
          <div key={week.weekId}>
            <h2 className="mb-2 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              Week {week.weekNumber} · {week.seasonYear}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-500">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Pick</th>
                    <th className="px-4 py-3 text-right">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {week.rows.map((row) => (
                    <tr
                      key={row.participantId}
                      className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{row.name}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {row.pick ? (
                          <>
                            <span className="text-zinc-900 dark:text-zinc-100">
                              {row.pick.pickedTeam} {formatSpread(row.pick.spreadAtPick)}
                            </span>{" "}
                            <span className="text-zinc-400 dark:text-zinc-500">vs {row.pick.opponent}</span>
                          </>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-600">No pick</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.pick ? (
                          <ResultBadge result={row.pick.result} coverMargin={row.pick.coverMargin} />
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-700">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultBadge({
  result,
  coverMargin,
}: {
  result: "PENDING" | "WIN" | "LOSS" | "PUSH";
  coverMargin: number | null;
}) {
  if (result === "PENDING") {
    return (
      <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        Pending
      </span>
    );
  }

  const style =
    result === "WIN"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
      : result === "LOSS"
        ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";

  const margin = coverMargin !== null ? ` (${coverMargin > 0 ? "+" : ""}${coverMargin.toFixed(1)})` : "";

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${style}`}>
      {result}
      {margin}
    </span>
  );
}

function formatSpread(spread: number): string {
  return spread > 0 ? `+${spread}` : `${spread}`;
}
