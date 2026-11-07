"use client";

import type { Match } from "@/types";
import { PlayerName } from "@/components/ui/PlayerName";
import { countSets, formatSets } from "@/lib/scoring";

interface Props {
  matches: Match[];
  onMatchClick: (m: Match) => void;
}

export default function MatchList({ matches, onMatchClick }: Props) {
  return (
    <ul className="divide-y divide-border">
      {matches.map((m) => {
        const playable = Boolean(m.p1 && m.p2);
        const sets = m.sets ? countSets(m.sets) : null;
        return (
          <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
            <span className="w-full text-xs text-muted sm:w-40">{m.label}</span>
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className={m.winner === m.p1 && m.winner ? "font-semibold" : ""}>
                <PlayerName id={m.p1} />
              </span>
              <span className="font-semibold tabular-nums">{sets ? `${sets[0]}:${sets[1]}` : "–"}</span>
              <span className={m.winner === m.p2 && m.winner ? "font-semibold" : ""}>
                <PlayerName id={m.p2} />
              </span>
            </span>
            {m.sets && <span className="hidden text-xs text-muted md:inline">{formatSets(m.sets)}</span>}
            {playable && (
              <button
                onClick={() => onMatchClick(m)}
                className={`rounded-lg px-3 py-1 text-xs font-medium ${
                  m.winner ? "border border-border hover:bg-foreground/5" : "bg-accent text-white hover:opacity-90"
                }`}
              >
                {m.winner ? "Изменить" : "Ввести счёт"}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
