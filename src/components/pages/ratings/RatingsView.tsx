"use client";

import { useState } from "react";
import { useData } from "@/components/providers/DataProvider";
import { Card, Delta, PageTitle } from "@/components/ui";
import { PlayerName } from "@/components/ui/PlayerName";
import AddPlayerDialog from "@/components/ui/AddPlayerDialog";

export default function RatingsView() {
  const { players, rating } = useData();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  const stats = new Map<string, { won: number; lost: number; last: number }>();
  for (const p of players) stats.set(p.id, { won: 0, lost: 0, last: 0 });
  // изменение рейтинга за последний турнир игрока
  const lastTournament = new Map<string, string>();
  for (const { match: m, tournament, delta } of rating.played) {
    for (const [pid, d] of [[m.p1, delta[0]], [m.p2, delta[1]]] as const) {
      if (!pid) continue;
      const s = stats.get(pid);
      if (!s) continue;
      if (m.winner === pid) s.won++;
      else s.lost++;
      if (lastTournament.get(pid) !== tournament.id) {
        lastTournament.set(pid, tournament.id);
        s.last = 0;
      }
      s.last += d;
    }
  }

  const ranked = [...players]
    .sort((a, b) => rating.ratings[b.id] - rating.ratings[a.id])
    .map((p, i) => ({ p, place: i + 1 }));
  const q = query.trim().toLowerCase();
  const list = q ? ranked.filter(({ p }) => p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q)) : ranked;

  return (
    <div>
      <PageTitle
        title="Рейтинг игроков"
        subtitle="Пересчитывается после каждого сыгранного матча"
        action={
          <button
            onClick={() => setAdding(true)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            + Добавить игрока
          </button>
        }
      />
      {adding && <AddPlayerDialog onClose={() => setAdding(false)} />}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по имени или городу"
        className="mb-4 w-full max-w-sm rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="w-12 py-2 pl-4">#</th>
                <th className="py-2">Игрок</th>
                <th className="py-2">Город</th>
                <th className="py-2 text-center">Матчи</th>
                <th className="py-2 text-center">Победы</th>
                <th className="py-2 text-center" title="Изменение за последний турнир">±</th>
                <th className="py-2 pr-4 text-right">Рейтинг</th>
              </tr>
            </thead>
            <tbody>
              {list.map(({ p, place }) => {
                const s = stats.get(p.id) ?? { won: 0, lost: 0, last: 0 };
                const total = s.won + s.lost;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className={`py-2.5 pl-4 font-semibold ${place <= 3 ? "text-accent" : "text-muted"}`}>{place}</td>
                    <td className="py-2.5">
                      <PlayerName id={p.id} />
                    </td>
                    <td className="py-2.5 text-muted">{p.city}</td>
                    <td className="py-2.5 text-center tabular-nums">{total}</td>
                    <td className="py-2.5 text-center tabular-nums">
                      {total ? `${Math.round((s.won / total) * 100)}%` : "—"}
                    </td>
                    <td className="py-2.5 text-center tabular-nums">{total ? <Delta value={s.last} /> : "—"}</td>
                    <td className="py-2.5 pr-4 text-right font-semibold tabular-nums">{rating.ratings[p.id]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-3 text-xs text-muted">
        Рейтинг считается по системе Эло: за победу над более сильным соперником даётся больше очков.
      </p>
    </div>
  );
}
