"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "This Week" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
        <span className="font-semibold tracking-tight">🔒 Lock of the Week</span>
        <nav className="flex gap-4 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname === link.href
                  ? "font-semibold text-zinc-950 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
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
