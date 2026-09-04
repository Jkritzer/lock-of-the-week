"use client";

import { useRouter } from "next/navigation";

export default function WeekSelect({
  weeks,
  selectedWeekId,
}: {
  weeks: { id: string; label: string }[];
  selectedWeekId: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selectedWeekId}
      onChange={(e) => router.push(`/history?week=${e.target.value}`)}
      className="shrink-0 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:border-blue-500 dark:focus:ring-blue-500/10"
    >
      {weeks.map((w) => (
        <option key={w.id} value={w.id}>
          {w.label}
        </option>
      ))}
    </select>
  );
}
