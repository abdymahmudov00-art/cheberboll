"use client";

import type { BracketRound, Match } from "@/types";
import { useData } from "@/components/providers/DataProvider";
import { countSets } from "@/lib/scoring";

interface Props {
  rounds: BracketRound[];
  onMatchClick: (m: Match) => void;
}

export default function Bracket({ rounds, onMatchClick }: Props) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-6">
        {rounds.map((round) => (
          <div key={round.title} className="flex w-60 flex-col">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{round.title}</div>
            <div className="flex flex-1 flex-col justify-around gap-3">
              {round.matches.map((m) => (
                <BracketMatch key={m.id} match={m} onClick={() => onMatchClick(m)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketMatch({ match, onClick }: { match: Match; onClick: () => void }) {
  const { playerById } = useData();
  const sets = match.sets ? countSets(match.sets) : null;
  const playable = Boolean(match.p1 && match.p2) && !match.bye;

  const line = (id: string | null, score: number | undefined) => {
    const isWinner = match.winner !== null && match.winner === id;
    const isLoser = match.winner !== null && id !== null && match.winner !== id;
    return (
      <div className={`flex items-center justify-between gap-2 px-3 py-1.5 ${isLoser ? "text-muted" : ""}`}>
        <span className={`truncate ${isWinner ? "font-semibold" : ""}`}>
          {id ? playerById[id]?.name : match.bye ? "свободный проход" : "—"}
        </span>
        <span className={`tabular-nums ${isWinner ? "font-semibold text-accent" : ""}`}>{score ?? ""}</span>
      </div>
    );
  };

  return (
    <button
      onClick={onClick}
      disabled={!playable}
      className={`w-full overflow-hidden rounded-lg border bg-card text-left text-sm transition ${
        match.bye ? "border-dashed border-border opacity-60" : "border-border"
      } ${playable ? "hover:border-accent" : "cursor-default"}`}
    >
      {line(match.p1, sets?.[0])}
      <div className="border-t border-border" />
      {line(match.p2, sets?.[1])}
    </button>
  );
}
