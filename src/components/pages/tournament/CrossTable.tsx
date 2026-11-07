"use client";

import type { Match, StandingRow } from "@/types";
import { useData } from "@/components/providers/DataProvider";
import { scoreFor } from "@/lib/labels";

interface Props {
  /** Строки таблицы: из них берутся очки (О) и место (М) */
  standings: StandingRow[];
  matches: Match[];
  onMatchClick: (m: Match) => void;
  /** Места начинаются с placeOffset + 1 (для второго финала) */
  placeOffset?: number;
}

/** Шахматка: результат каждой встречи с точки зрения игрока в строке */
export default function CrossTable({ standings, matches, onMatchClick, placeOffset = 0 }: Props) {
  const { playerById, live } = useData();
  const playerIds = standings.map((r) => r.playerId);

  function findMatches(a: string, b: string) {
    return matches.filter((m) => (m.p1 === a && m.p2 === b) || (m.p1 === b && m.p2 === a));
  }

  function cell(m: Match, rowId: string) {
    const table = live[m.id]?.table;
    let label = "·";
    let cls = "text-muted hover:bg-foreground/5";
    if (m.winner) {
      label = scoreFor(m, rowId);
      cls =
        m.winner === rowId
          ? "bg-win/10 text-win font-semibold hover:bg-win/20"
          : "bg-loss/10 text-loss hover:bg-loss/20";
    } else if (table) {
      label = `${table} ст`;
      cls = "bg-win text-white font-semibold";
    }
    return (
      <button
        key={m.id}
        onClick={() => onMatchClick(m)}
        className={`h-9 w-full min-w-12 rounded-md text-center tabular-nums transition ${cls}`}
        title={m.carried ? "Встреча из группы, засчитана в финале" : "Открыть счёт матча"}
      >
        {label}
        {m.carried && <sup className="ml-0.5 text-[9px] opacity-70">гр</sup>}
      </button>
    );
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
            <th className="w-12 px-1 py-2 text-center text-xs font-semibold" title="Очки: 2 за победу, 1 за поражение, 0 за неявку">
              О
            </th>
            <th className="w-12 px-1 py-2 text-center text-xs font-semibold" title="Место">
              М
            </th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => {
            const rowId = row.playerId;
            return (
              <tr key={rowId}>
                <td className="sticky left-0 whitespace-nowrap bg-card py-1 pr-3 text-sm">
                  <span className="mr-2 text-xs text-muted">{i + 1}</span>
                  {playerById[rowId]?.name}
                </td>
                {playerIds.map((colId) => {
                  if (rowId === colId) return <td key={colId} className="h-10 bg-foreground/10" />;
                  const ms = findMatches(rowId, colId);
                  return (
                    <td key={colId} className="p-0.5">
                      <div className="flex flex-col gap-0.5">{ms.map((m) => cell(m, rowId))}</div>
                    </td>
                  );
                })}
                <td className="px-1 text-center font-semibold tabular-nums">{row.score}</td>
                <td className="px-1 text-center font-semibold tabular-nums">
                  {row.played > 0 ? placeOffset + row.place : "–"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
