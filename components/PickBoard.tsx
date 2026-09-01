"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Participant = { id: string; name: string };

type Game = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  homeSpread: number | null;
  status: "SCHEDULED" | "FINAL" | "CANCELLED";
};

type CurrentPick = {
  gameId: string;
  pickedTeam: string;
  spreadAtPick: number;
} | null;

export default function PickBoard({
  participants,
  games,
  weekLabel,
  initialParticipant,
  initialPick,
}: {
  participants: Participant[];
  games: Game[];
  weekLabel: string;
  initialParticipant: Participant | null;
  initialPick: CurrentPick;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!initialParticipant) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-1 text-xl font-semibold">{weekLabel}</h1>
        <p className="mb-6 text-zinc-500">Who&apos;s picking?</p>
        <div className="flex flex-wrap gap-2">
          {participants.map((p) => (
            <button
              key={p.id}
              disabled={isPending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const res = await fetch("/api/identity", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ participantId: p.id }),
                  });
                  if (!res.ok) {
                    setError("Couldn't select that name. Try again.");
                    return;
                  }
                  router.refresh();
                });
              }}
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium hover:border-zinc-950 disabled:opacity-50 dark:border-zinc-700 dark:hover:border-zinc-50"
            >
              {p.name}
            </button>
          ))}
        </div>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  const pickedGame = initialPick ? games.find((g) => g.id === initialPick.gameId) : undefined;
  const isLocked =
    initialPick !== null &&
    (pickedGame === undefined || new Date(pickedGame.commenceTime) <= new Date());

  async function submitPick(gameId: string, pickedTeam: string) {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, pickedTeam }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't submit that pick.");
        return;
      }
      router.refresh();
    });
  }

  function switchPerson() {
    startTransition(async () => {
      await fetch("/api/identity", { method: "DELETE" });
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{weekLabel}</h1>
          <p className="text-zinc-500">
            Picking as <span className="font-medium text-zinc-950 dark:text-zinc-50">{initialParticipant.name}</span>
          </p>
        </div>
        <button
          onClick={switchPerson}
          disabled={isPending}
          className="text-sm text-zinc-500 underline hover:text-zinc-950 dark:hover:text-zinc-50"
        >
          Not you?
        </button>
      </div>

      {initialPick && (
        <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          Your lock:{" "}
          <span className="font-semibold">
            {initialPick.pickedTeam} {formatSpread(initialPick.spreadAtPick)}
          </span>
          {isLocked ? " — locked in, kickoff has passed." : " — you can still change this."}
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {games.length === 0 && (
        <p className="text-zinc-500">No games loaded for this week yet — check back soon.</p>
      )}

      <div className="flex flex-col gap-3">
        {games.map((game) => {
          const started = new Date(game.commenceTime) <= new Date();
          const noSpread = game.homeSpread === null;
          const disabled = started || noSpread || isLocked || isPending;
          const isPickedGame = initialPick?.gameId === game.id;

          return (
            <div
              key={game.id}
              className="rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <div className="mb-2 text-xs text-zinc-500">
                {new Date(game.commenceTime).toLocaleString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {noSpread && " · spread not posted yet"}
              </div>
              <div className="flex gap-2">
                <TeamButton
                  label={game.awayTeam}
                  spread={game.homeSpread === null ? null : -game.homeSpread}
                  selected={isPickedGame && initialPick?.pickedTeam === game.awayTeam}
                  disabled={disabled}
                  onClick={() => submitPick(game.id, game.awayTeam)}
                />
                <TeamButton
                  label={game.homeTeam}
                  spread={game.homeSpread}
                  selected={isPickedGame && initialPick?.pickedTeam === game.homeTeam}
                  disabled={disabled}
                  onClick={() => submitPick(game.id, game.homeTeam)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TeamButton({
  label,
  spread,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  spread: number | null;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex-1 rounded-md border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
          : "border-zinc-300 hover:border-zinc-950 dark:border-zinc-700 dark:hover:border-zinc-50",
      ].join(" ")}
    >
      <div className="font-medium">{label}</div>
      <div className="text-xs opacity-70">{spread === null ? "—" : formatSpread(spread)}</div>
    </button>
  );
}

function formatSpread(spread: number): string {
  return spread > 0 ? `+${spread}` : `${spread}`;
}
