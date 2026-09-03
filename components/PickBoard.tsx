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

type RosterEntry = {
  id: string;
  name: string;
  pick: { team: string; spread: number; locked: boolean } | null;
};

export default function PickBoard({
  participants,
  games,
  weekLabel,
  initialParticipant,
  initialPick,
  roster,
}: {
  participants: Participant[];
  games: Game[];
  weekLabel: string;
  initialParticipant: Participant | null;
  initialPick: CurrentPick;
  roster: RosterEntry[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  if (!initialParticipant) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold tracking-tight">{weekLabel}</h1>
        <p className="mt-1 mb-8 text-zinc-500 dark:text-zinc-400">Who&apos;s picking?</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
              className="flex flex-col items-center gap-2.5 rounded-2xl border border-zinc-200 bg-white px-4 py-5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-base font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {initials(p.name)}
              </span>
              {p.name}
            </button>
          ))}
        </div>
        {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{weekLabel}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Picking as{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{initialParticipant.name}</span>
          </p>
        </div>
        <button
          onClick={switchPerson}
          disabled={isPending}
          className="shrink-0 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
        >
          Not you?
        </button>
      </div>

      {initialPick && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm dark:border-blue-500/30 dark:bg-blue-500/10">
          <LockIcon className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="text-blue-900 dark:text-blue-200">
            Your lock:{" "}
            <span className="font-semibold">
              {initialPick.pickedTeam} {formatSpread(initialPick.spreadAtPick)}
            </span>
            <span className="text-blue-700/70 dark:text-blue-300/70">
              {isLocked ? " — locked in, kickoff has passed." : " — you can still change this."}
            </span>
          </p>
        </div>
      )}

      {roster.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-500">
              Football Guys
            </h2>
            <span className="text-xs text-zinc-400 dark:text-zinc-600">
              {roster.filter((r) => r.pick === null).length} still picking
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {roster.map((r) => (
              <div
                key={r.id}
                className={[
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                  r.id === initialParticipant.id
                    ? "border-blue-300 bg-blue-50 dark:border-blue-500/50 dark:bg-blue-500/10"
                    : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
                ].join(" ")}
              >
                <span
                  className={[
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    r.pick === null ? "bg-amber-500" : r.pick.locked ? "bg-emerald-500" : "bg-blue-500",
                  ].join(" ")}
                />
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{r.name}</span>
                <span className="text-zinc-400 dark:text-zinc-600">
                  {r.pick === null ? "picking" : `${r.pick.team} ${formatSpread(r.pick.spread)}`}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3 text-xs text-zinc-400 dark:text-zinc-600">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> still picking
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> picked
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> locked in
            </span>
          </div>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}

      {games.length === 0 && (
        <p className="text-zinc-500 dark:text-zinc-400">No games loaded for this week yet — check back soon.</p>
      )}

      {games.length > 0 && (
        <div className="relative mb-4">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a team…"
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-blue-500 dark:focus:ring-blue-500/10"
          />
        </div>
      )}

      {games.length > 0 && filteredGames.length === 0 && (
        <p className="text-zinc-500 dark:text-zinc-400">No games match &quot;{query}&quot;.</p>
      )}

      <div className="flex flex-col gap-6">
        {groupGamesByDay(filteredGames).map((day) => (
          <div key={day.key}>
            <h3 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">{day.label}</h3>
            <div className="flex flex-col gap-3">
              {day.games.map((game) => {
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
                    className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
                      <span>
                        {new Date(game.commenceTime).toLocaleString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {started && <span className="ml-2 text-zinc-400 dark:text-zinc-600">· Kicked off</span>}
                      </span>
                      {noSpread && (
                        <span className="font-medium text-amber-600 dark:text-amber-500">No spread yet</span>
                      )}
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      <TeamRow
                        label={game.awayTeam}
                        logo={game.awayLogo}
                        spread={game.homeSpread === null ? null : -game.homeSpread}
                        selected={awaySelected}
                        disabled={baseDisabled || awayTakenByOther}
                        takenBy={awayTakenByOther ? game.awayPickedBy : null}
                        onClick={() => submitPick(game.id, game.awayTeam)}
                      />
                      <TeamRow
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
        ))}
      </div>
    </div>
  );
}

function groupGamesByDay(games: Game[]): { key: string; label: string; games: Game[] }[] {
  const groups: { key: string; label: string; games: Game[] }[] = [];
  for (const game of games) {
    const date = new Date(game.commenceTime);
    const key = date.toDateString();
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.key === key) {
      lastGroup.games.push(game);
    } else {
      groups.push({
        key,
        label: date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }),
        games: [game],
      });
    }
  }
  return groups;
}

function TeamRow({
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
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors disabled:cursor-not-allowed",
        selected
          ? "bg-blue-50 dark:bg-blue-500/10"
          : "hover:bg-zinc-50 disabled:hover:bg-transparent dark:hover:bg-zinc-800/60",
      ].join(" ")}
    >
      <TeamLogo src={logo} alt={label} muted={disabled && !selected} />
      <div className="min-w-0 flex-1">
        <div
          className={[
            "truncate text-sm font-medium",
            selected
              ? "text-blue-700 dark:text-blue-300"
              : disabled
                ? "text-zinc-400 dark:text-zinc-600"
                : "text-zinc-900 dark:text-zinc-100",
          ].join(" ")}
        >
          {label}
        </div>
        {takenBy && (
          <div className="mt-0.5 truncate text-xs text-zinc-400 dark:text-zinc-600">taken by {takenBy}</div>
        )}
      </div>
      <div
        className={[
          "flex shrink-0 items-center gap-1.5 text-sm font-semibold tabular-nums",
          selected
            ? "text-blue-700 dark:text-blue-300"
            : disabled
              ? "text-zinc-400 dark:text-zinc-600"
              : "text-zinc-600 dark:text-zinc-400",
        ].join(" ")}
      >
        {spread === null ? "—" : formatSpread(spread)}
        {spread !== null && spread < 0 && (
          <span
            className={[
              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              selected
                ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
            ].join(" ")}
          >
            FAV
          </span>
        )}
      </div>
      {selected && <CheckIcon className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />}
    </button>
  );
}

function TeamLogo({ src, alt, muted }: { src: string | null; alt: string; muted: boolean }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600">
        <ShieldIcon className="h-4 w-4" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={36}
      height={36}
      className={["h-9 w-9 shrink-0 object-contain", muted ? "opacity-40 grayscale" : ""].join(" ")}
      onError={() => setFailed(true)}
    />
  );
}

function initials(name: string): string {
  const letters = name.match(/\p{L}/gu) ?? [];
  return (letters[0] ?? "?").toUpperCase();
}

function formatSpread(spread: number): string {
  return spread > 0 ? `+${spread}` : `${spread}`;
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <rect x="5" y="11" width="14" height="9" rx="2" strokeLinejoin="round" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className}>
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
