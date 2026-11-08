"use client";

import Link from "next/link";
import { useData } from "@/components/providers/DataProvider";
import { Card, Delta, EmptyState, SectionTitle } from "@/components/ui";
import { PlayerName } from "@/components/ui/PlayerName";
import { formatSets } from "@/lib/scoring";
import { scoreFor } from "@/lib/labels";
import { useI18n } from "@/hooks/useI18n";
import RatingChart from "./RatingChart";

export default function PlayerView({ id }: { id: string }) {
  const { playerById, players, rating, tournaments, data } = useData();
  const player = playerById[id];
  const { t, tg, date } = useI18n();

  if (!player) {
    return (
      <EmptyState>
        {t("pv.notFound")} <Link href="/ratings" className="text-accent hover:underline">{t("pv.toRating")}</Link>
      </EmptyState>
    );
  }

  const place = [...players].sort((a, b) => rating.ratings[b.id] - rating.ratings[a.id]).findIndex((p) => p.id === id) + 1;
  const matches = rating.played.filter(({ match: m }) => m.p1 === id || m.p2 === id).reverse();
  const won = matches.filter(({ match: m }) => m.winner === id).length;
  const lost = matches.length - won;
  const diff = rating.ratings[id] - player.startRating;

  const results = tournaments
    .map((t) => {
      const d = data[t.id];
      const p = d?.placements.find((x) => x.playerId === id);
      return p ? { t, place: p.place } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.t.date.localeCompare(a.t.date));

  const stats = [
    { label: t("pv.rating"), value: rating.ratings[id] },
    { label: t("pv.place"), value: t("pv.placeOf", { a: place, b: players.length }) },
    { label: t("pv.matches"), value: matches.length },
    { label: t("pv.wins"), value: matches.length ? `${won} (${Math.round((won / matches.length) * 100)}%)` : "—" },
  ];

  return (
    <div className="space-y-6">
      <Link href="/ratings" className="inline-block text-sm text-muted hover:text-accent">
        {t("pv.back")}
      </Link>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-xl font-bold text-accent">
            {player.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{player.name}</h1>
            <p className="text-muted">
              {player.city}
              {player.birthYear ? t("pv.born", { y: player.birthYear }) : ""}
              {player.hand ? t(player.hand === "right" ? "pv.handRight" : "pv.handLeft") : ""}
            </p>
          </div>
          <div className="text-right text-sm text-muted">
            {t("pv.sinceStart")} <Delta value={diff} />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg bg-foreground/5 px-3 py-2">
              <div className="text-xs text-muted">{s.label}</div>
              <div className="text-lg font-semibold tabular-nums">{s.value}</div>
            </div>
          ))}
        </div>
      </Card>

      <section>
        <SectionTitle>{t("pv.rating")}</SectionTitle>
        <Card className="p-4">
          <RatingChart points={rating.history[id] ?? []} />
        </Card>
      </section>

      {results.length > 0 && (
        <section>
          <SectionTitle>{t("pv.results")}</SectionTitle>
          <Card>
            <ul className="divide-y divide-border">
              {results.map(({ t: tour, place: p }) => (
                <li key={tour.id} className="flex items-center gap-4 px-4 py-3 text-sm">
                  <Link href={`/tournaments/${tour.id}`} className="flex-1 hover:text-accent">
                    {tour.name}
                  </Link>
                  <span className="text-muted">{date(tour.date)}</span>
                  <span className={`w-20 text-right font-semibold ${p === "1" ? "text-accent" : ""}`}>{t("t.place", { p })}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      <section>
        <SectionTitle>
          {t("pv.history")} <span className="text-sm font-normal text-muted">{t("pv.wl", { w: won, l: lost })}</span>
        </SectionTitle>
        {matches.length ? (
          <Card>
            <ul className="divide-y divide-border">
              {matches.map(({ match: m, tournament, delta }) => {
                const isP1 = m.p1 === id;
                const opp = isP1 ? m.p2 : m.p1;
                const win = m.winner === id;
                return (
                  <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        win ? "bg-win/15 text-win" : "bg-loss/15 text-loss"
                      }`}
                    >
                      {win ? t("pv.W") : t("pv.L")}
                    </span>
                    <span className="min-w-40 flex-1">
                      vs <PlayerName id={opp} />
                      <span className="block text-xs text-muted">
                        {tournament.name} · {tg(m.label)}
                      </span>
                    </span>
                    <span className="hidden text-xs text-muted sm:inline">{m.sets && formatSets(m.sets)}</span>
                    <span className="font-semibold tabular-nums">
                      {scoreFor(m, id)}
                    </span>
                    <span className="w-10 text-right tabular-nums">
                      <Delta value={isP1 ? delta[0] : delta[1]} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : (
          <EmptyState>{t("pv.noMatches")}</EmptyState>
        )}
      </section>
    </div>
  );
}
