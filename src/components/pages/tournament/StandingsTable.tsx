"use client";

import type { StandingRow } from "@/types";
import { PlayerName } from "@/components/ui/PlayerName";

export default function StandingsTable({ rows, highlightTop = 0 }: { rows: StandingRow[]; highlightTop?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            <th className="w-10 py-2 pl-4">#</th>
            <th className="py-2">Игрок</th>
            <th className="py-2 text-center" title="Сыграно матчей">И</th>
            <th className="py-2 text-center" title="Победы">В</th>
            <th className="py-2 text-center" title="Поражения">П</th>
            <th className="py-2 text-center">Партии</th>
            <th className="py-2 text-center">Мячи</th>
            <th className="py-2 pr-4 text-center" title="2 очка за победу, 1 за поражение">Очки</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.playerId} className="border-b border-border last:border-0">
              <td className="py-2.5 pl-4">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    r.place <= highlightTop && r.played > 0 ? "bg-accent text-white" : "text-muted"
                  }`}
                >
                  {r.place}
                </span>
              </td>
              <td className="py-2.5">
                <PlayerName id={r.playerId} />
              </td>
              <td className="py-2.5 text-center tabular-nums">{r.played}</td>
              <td className="py-2.5 text-center tabular-nums text-win">{r.won}</td>
              <td className="py-2.5 text-center tabular-nums text-loss">{r.lost}</td>
              <td className="py-2.5 text-center tabular-nums">
                {r.setsWon}:{r.setsLost}
              </td>
              <td className="py-2.5 text-center tabular-nums text-muted">
                {r.pointsWon}:{r.pointsLost}
              </td>
              <td className="py-2.5 pr-4 text-center font-semibold tabular-nums">{r.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
