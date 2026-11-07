"use client";

import type { Match } from "@/types";
import { useData } from "@/components/providers/DataProvider";
import { countSets } from "@/lib/scoring";

interface Props {
  /** Игроки в порядке мест */
  playerIds: string[];
  matches: Match[];
  onMatchClick: (m: Match) => void;
}

/** Шахматка: результат каждой встречи с точки зрения игрока в строке */
export default function CrossTable({ playerIds, matches, onMatchClick }: Props) {
  const { playerById } = useData();

  function findMatch(a: string, b: string) {
    return matches.find((m) => (m.p1 === a && m.p2 === b) || (m.p1 === b && m.p2 === a));
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 bg-card" />
            {playerIds.map((id, i) => (
              <th key={id} className="w-14 px-1 py-2 text-center text-xs font-medium text-muted" title={playerById[id]?.name}>
                {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {playerIds.map((rowId, i) => (
            <tr key={rowId}>
              <td className="sticky left-0 whitespace-nowrap bg-card py-1 pr-3 text-sm">
                <span className="mr-2 text-xs text-muted">{i + 1}</span>
                {playerById[rowId]?.name}
              </td>
              {playerIds.map((colId) => {
                if (rowId === colId) {
                  return <td key={colId} className="h-10 bg-foreground/10" />;
                }
                const m = findMatch(rowId, colId);
                if (!m) return <td key={colId} />;
                let label = "·";
                let cls = "text-muted hover:bg-foreground/5";
                if (m.winner && m.sets) {
                  const [a, b] = countSets(m.sets);
                  const [mine, theirs] = m.p1 === rowId ? [a, b] : [b, a];
                  label = `${mine}:${theirs}`;
                  cls = mine > theirs ? "bg-win/10 text-win font-semibold hover:bg-win/20" : "bg-loss/10 text-loss hover:bg-loss/20";
                }
                return (
                  <td key={colId} className="p-0.5">
                    <button
                      onClick={() => onMatchClick(m)}
                      className={`h-9 w-full min-w-12 rounded-md text-center tabular-nums transition ${cls}`}
                      title="Открыть счёт матча"
                    >
                      {label}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
