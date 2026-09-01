import { getWeeklyHistory } from "@/lib/history";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const weeks = await getWeeklyHistory();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-xl font-semibold">Picks by Week</h1>
      <p className="mb-6 text-zinc-500">Who picked what, every week of the season.</p>

      {weeks.length === 0 && <p className="text-zinc-500">No weeks yet.</p>}

      <div className="flex flex-col gap-8">
        {weeks.map((week) => (
          <div key={week.weekId}>
            <h2 className="mb-2 font-semibold">
              Week {week.weekNumber} · {week.seasonYear}
            </h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800">
                  <th className="py-2 pr-2">Name</th>
                  <th className="py-2 pr-2">Pick</th>
                  <th className="py-2 pr-2 text-right">Result</th>
                </tr>
              </thead>
              <tbody>
                {week.rows.map((row) => (
                  <tr key={row.participantId} className="border-b border-zinc-100 dark:border-zinc-900">
                    <td className="py-2 pr-2 font-medium">{row.name}</td>
                    <td className="py-2 pr-2">
                      {row.pick ? (
                        <>
                          {row.pick.pickedTeam} {formatSpread(row.pick.spreadAtPick)}{" "}
                          <span className="text-zinc-500">vs {row.pick.opponent}</span>
                        </>
                      ) : (
                        <span className="text-zinc-400">No pick</span>
                      )}
                    </td>
                    <td className="py-2 pr-2 text-right">
                      {row.pick ? <ResultBadge result={row.pick.result} coverMargin={row.pick.coverMargin} /> : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
  if (result === "PENDING") return <span className="text-zinc-400">Pending</span>;

  const color =
    result === "WIN"
      ? "text-emerald-600 dark:text-emerald-400"
      : result === "LOSS"
        ? "text-red-600 dark:text-red-400"
        : "text-zinc-500";

  const margin = coverMargin !== null ? ` (${coverMargin > 0 ? "+" : ""}${coverMargin.toFixed(1)})` : "";

  return (
    <span className={color}>
      {result}
      {margin}
    </span>
  );
}

function formatSpread(spread: number): string {
  return spread > 0 ? `+${spread}` : `${spread}`;
}
