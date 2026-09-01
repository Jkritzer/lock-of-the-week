import { getStandings } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const standings = await getStandings();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-xl font-semibold">Season Leaderboard</h1>
      <p className="mb-6 text-zinc-500">Record, then cover margin as the tiebreaker.</p>

      {standings.length === 0 || standings.every((s) => s.wins + s.losses + s.pushes === 0) ? (
        <p className="text-zinc-500">No graded picks yet — check back after this week&apos;s games finish.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Name</th>
              <th className="py-2 pr-2">Record</th>
              <th className="py-2 pr-2 text-right">Cover Margin</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => (
              <tr key={row.participantId} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-2 pr-2 text-zinc-500">{i + 1}</td>
                <td className="py-2 pr-2 font-medium">{row.name}</td>
                <td className="py-2 pr-2">
                  {row.wins}-{row.losses}
                  {row.pushes > 0 ? `-${row.pushes}` : ""}
                </td>
                <td className="py-2 pr-2 text-right tabular-nums">
                  {row.totalCoverMargin > 0 ? "+" : ""}
                  {row.totalCoverMargin.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
