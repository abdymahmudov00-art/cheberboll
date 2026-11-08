"use client";

import { useState } from "react";
import Link from "next/link";
import { useData } from "@/components/providers/DataProvider";
import { Card, Delta, EmptyState, PageTitle } from "@/components/ui";
import { PlayerName } from "@/components/ui/PlayerName";
import { formatSets } from "@/lib/scoring";
import { matchScoreText } from "@/lib/labels";
import { useI18n } from "@/hooks/useI18n";

export default function MatchesView() {
  const { rating, tournaments, playerById } = useData();
  const [tournamentId, setTournamentId] = useState("all");
  const [query, setQuery] = useState("");
  const { t, tg, date } = useI18n();

  const q = query.trim().toLowerCase();
  const list = [...rating.played]
    .reverse()
    .filter(({ tournament }) => tournamentId === "all" || tournament.id === tournamentId)
    .filter(({ match: m }) => {
      if (!q) return true;
      return [m.p1, m.p2].some((pid) => pid && playerById[pid]?.name.toLowerCase().includes(q));
    });

  // группируем по турнирам, сохраняя порядок
  const groups: { id: string; name: string; date: string; items: typeof list }[] = [];
  for (const item of list) {
    const last = groups[groups.length - 1];
    if (last && last.id === item.tournament.id) last.items.push(item);
    else groups.push({ id: item.tournament.id, name: item.tournament.name, date: item.tournament.date, items: [item] });
  }

  const withMatches = tournaments.filter((t) => rating.played.some((p) => p.tournament.id === t.id));

  return (
    <div>
      <PageTitle title={t("mv.title")} subtitle={t("mv.total", { n: rating.played.length })} />

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("mv.search")}
          className="w-full max-w-xs rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <select
          value={tournamentId}
          onChange={(e) => setTournamentId(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="all">{t("mv.all")}</option>
          {withMatches.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {groups.length === 0 && <EmptyState>{t("mv.empty")}</EmptyState>}

      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g.id}>
            <div className="mb-2 flex items-baseline gap-3">
              <Link href={`/tournaments/${g.id}`} className="font-semibold hover:text-accent">
                {g.name}
              </Link>
              <span className="text-sm text-muted">{date(g.date)}</span>
            </div>
            <Card>
              <ul className="divide-y divide-border">
                {g.items.map(({ match: m, delta }) => {
                  return (
                    <li key={m.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 text-sm sm:grid-cols-[9rem_1fr_auto_1fr_auto]">
                      <span className="hidden text-xs text-muted sm:block">{tg(m.label)}</span>
                      <span className={`text-right ${m.winner === m.p1 ? "font-semibold" : ""}`}>
                        <PlayerName id={m.p1} /> <span className="text-xs font-normal"><Delta value={delta[0]} /></span>
                      </span>
                      <span className="rounded-md bg-foreground/5 px-2 py-0.5 text-center font-semibold tabular-nums">
                        {matchScoreText(m)}
                      </span>
                      <span className={m.winner === m.p2 ? "font-semibold" : ""}>
                        <PlayerName id={m.p2} /> <span className="text-xs font-normal"><Delta value={delta[1]} /></span>
                      </span>
                      <span className="hidden text-xs text-muted sm:block">{m.sets && formatSets(m.sets)}</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
}
