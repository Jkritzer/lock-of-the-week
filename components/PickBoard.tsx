"use client";

import Image from "next/image";
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
  awayLogo: string | null;
  homeLogo: string | null;
  awayPickedBy: string | null;
  homePickedBy: string | null;
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
  const [query, setQuery] = useState("");

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

  const normalizedQuery = query.trim().toLowerCase();
  const filteredGames = normalizedQuery
    ? games.filter(
        (g) =>
          g.homeTeam.toLowerCase().includes(normalizedQuery) ||
          g.awayTeam.toLowerCase().includes(normalizedQuery),
      )
    : games;

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

      {games.length > 0 && (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a team…"
          className="mb-4 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
        />
      )}

      {games.length > 0 && filteredGames.length === 0 && (
        <p className="text-zinc-500">No games match &quot;{query}&quot;.</p>
      )}

      <div className="flex flex-col gap-3">
        {filteredGames.map((game) => {
          const started = new Date(game.commenceTime) <= new Date();
          const noSpread = game.homeSpread === null;
          const isPickedGame = initialPick?.gameId === game.id;
          const awaySelected = isPickedGame && initialPick?.pickedTeam === game.awayTeam;
          const homeSelected = isPickedGame && initialPick?.pickedTeam === game.homeTeam;
          const awayTakenByOther = game.awayPickedBy !== null && !awaySelected;
          const homeTakenByOther = game.homePickedBy !== null && !homeSelected;
          const baseDisabled = started || noSpread || isLocked || isPending;

          return (
            <div
              key={game.id}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="mb-3 text-xs text-zinc-500">
                {new Date(game.commenceTime).toLocaleString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {noSpread && " · spread not posted yet"}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TeamButton
                  label={game.awayTeam}
                  logo={game.awayLogo}
                  spread={game.homeSpread === null ? null : -game.homeSpread}
                  selected={awaySelected}
                  disabled={baseDisabled || awayTakenByOther}
                  takenBy={awayTakenByOther ? game.awayPickedBy : null}
                  onClick={() => submitPick(game.id, game.awayTeam)}
                />
                <TeamButton
                  label={game.homeTeam}
                  logo={game.homeLogo}
                  spread={game.homeSpread}
                  selected={homeSelected}
                  disabled={baseDisabled || homeTakenByOther}
                  takenBy={homeTakenByOther ? game.homePickedBy : null}
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
  logo,
  spread,
  selected,
  disabled,
  takenBy,
  onClick,
}: {
  label: string;
  logo: string | null;
  spread: number | null;
  selected: boolean;
  disabled: boolean;
  takenBy: string | null;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex w-full min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
          : "border-zinc-300 hover:border-zinc-950 dark:border-zinc-700 dark:hover:border-zinc-50",
      ].join(" ")}
    >
      <TeamLogo src={logo} alt={label} />
      <div className="min-w-0">
        <div className="truncate font-medium">{label}</div>
        <div className="truncate text-xs opacity-70">
          {spread === null ? "—" : formatSpread(spread)}
          {takenBy && ` · taken by ${takenBy}`}
        </div>
      </div>
    </button>
  );
}

function TeamLogo({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
          <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={32}
      height={32}
      className="h-8 w-8 shrink-0 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

function formatSpread(spread: number): string {
  return spread > 0 ? `+${spread}` : `${spread}`;
}
