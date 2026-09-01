const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "Picking",
    body: [
      "Tap your name to pick as yourself — no password, just an honor system.",
      "Pick one game and one side against the spread each week. That's your lock.",
      "You can change your pick anytime, to any other game, as long as the game you currently have picked hasn't kicked off yet.",
    ],
  },
  {
    title: "The line",
    body: [
      "Whatever spread is showing when you submit is the one you're graded against — it's locked in right then, even if the line moves before kickoff.",
      "Spreads refresh automatically every 6 hours, so what you see should be fairly current.",
    ],
  },
  {
    title: "Locking in",
    body: [
      "Once your picked game kicks off, that pick is final for the week — no more changes.",
    ],
  },
  {
    title: "Grading",
    body: [
      "Games get checked roughly every 2 hours, so results usually post within a couple hours of the final whistle.",
      "Win = you covered the spread. Push = landed exactly on the spread (no win or loss). Loss = didn't cover.",
    ],
  },
  {
    title: "Leaderboard",
    body: [
      "Ranked by record — wins minus losses.",
      "Ties are broken by total cover margin: how many points you've covered by (or missed by) across the season, added up.",
    ],
  },
  {
    title: "Sharing a device",
    body: ["If someone else needs to pick on your phone or laptop, tap \"Not you?\" on the pick page first."],
  },
];

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-xl font-semibold">How It Works</h1>
      <p className="mb-6 text-zinc-500">The rules, in plain English.</p>

      <div className="flex flex-col gap-6">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="mb-2 font-semibold">{section.title}</h2>
            <ul className="flex flex-col gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
              {section.body.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-zinc-400">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
