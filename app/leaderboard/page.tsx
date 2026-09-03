import { getStandings } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const standings = await getStandings();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Season Leaderboard</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500 dark:text-zinc-400">Record, then cover margin as the tiebreaker.</p>

      {standings.length === 0 || standings.every((s) => s.wins + s.losses + s.pushes === 0) ? (
        <p className="text-zinc-500 dark:text-zinc-400">
          No graded picks yet — check back after this week&apos;s games finish.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-500">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Record</th>
                <th className="px-4 py-3 text-right">Cover Margin</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, i) => (
                <tr
                  key={row.participantId}
                  className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                >
                  <td className="px-4 py-3 text-zinc-400 dark:text-zinc-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{row.name}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {row.wins}-{row.losses}
                    {row.pushes > 0 ? `-${row.pushes}` : ""}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                    {row.totalCoverMargin > 0 ? "+" : ""}
                    {row.totalCoverMargin.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
