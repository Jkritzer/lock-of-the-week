"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "This Week" },
  { href: "/history", label: "History" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/rules", label: "Rules" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 w-full border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-display shrink-0 text-lg font-semibold tracking-tight whitespace-nowrap text-zinc-900 dark:text-zinc-50">
          🔒 Lock of the Week
        </span>
        <nav className="grid w-full grid-cols-4 gap-1 rounded-full bg-zinc-100 p-1 sm:w-auto dark:bg-zinc-800">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                "rounded-full px-1 py-2 text-center text-[13px] font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm " +
                (pathname === link.href
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100")
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
