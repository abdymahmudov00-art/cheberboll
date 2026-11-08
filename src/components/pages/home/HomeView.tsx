"use client";

import Link from "next/link";
import Image from "next/image";
import { useData } from "@/components/providers/DataProvider";
import { ButtonLink, Card, Delta, SectionTitle } from "@/components/ui";
import { PlayerName } from "@/components/ui/PlayerName";
import { matchScoreText } from "@/lib/labels";
import { useI18n } from "@/hooks/useI18n";
import TournamentCard from "@/components/pages/tournaments/TournamentCard";

export default function HomeView() {
  const { tournaments, data, rating, players, resetDemo } = useData();
  const { t, tg } = useI18n();

  const all = tournaments.map((t) => data[t.id]).filter(Boolean);
  const live = all.filter((d) => d.status === "live");
  const upcoming = all
    .filter((d) => d.status === "upcoming")
    .sort((a, b) => a.tournament.date.localeCompare(b.tournament.date))
    .slice(0, 3);
  const top = [...players].sort((a, b) => rating.ratings[b.id] - rating.ratings[a.id]).slice(0, 5);
  const recent = [...rating.played].reverse().slice(0, 6);

  return (
    <div className="space-y-10">
      <section className="flex items-center justify-between gap-8 rounded-2xl border border-border bg-card p-6 sm:p-10">
        <div>
        <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
          {t("home.hero1")} <span className="text-accent">{t("home.hero2")}</span>
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          {t("home.heroText")}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/tournaments/new">{t("home.create")}</ButtonLink>
          <ButtonLink href="/tournaments" variant="ghost">
            {t("home.browse")}
          </ButtonLink>
        </div>
        </div>
        <Image
          src="/kttf-emblem.svg"
          alt="Kyrgyz Table Tennis Federation"
          width={180}
          height={180}
          unoptimized
          className="hidden shrink-0 md:block"
        />
      </section>

      {live.length > 0 && (
        <section>
          <SectionTitle>{t("home.live")}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((d) => (
              <TournamentCard key={d.tournament.id} data={d} />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <SectionTitle action={<Link href="/tournaments" className="text-sm text-accent hover:underline">{t("home.allTournaments")}</Link>}>
            {t("home.upcoming")}
          </SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((d) => (
              <TournamentCard key={d.tournament.id} data={d} />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle action={<Link href="/ratings" className="text-sm text-accent hover:underline">{t("home.fullRating")}</Link>}>
            {t("home.top5")}
          </SectionTitle>
          <Card>
            <ol className="divide-y divide-border">
              {top.map((p, i) => (
                <li key={p.id} className="flex items-center gap-4 px-4 py-3">
                  <span className={`w-6 text-center font-semibold ${i < 3 ? "text-accent" : "text-muted"}`}>{i + 1}</span>
                  <span className="flex-1">
                    <PlayerName id={p.id} />
                    <span className="ml-2 text-xs text-muted">{p.city}</span>
                  </span>
                  <span className="font-semibold tabular-nums">{rating.ratings[p.id]}</span>
                </li>
              ))}
            </ol>
          </Card>
        </section>

        <section>
          <SectionTitle action={<Link href="/matches" className="text-sm text-accent hover:underline">{t("home.allMatches")}</Link>}>
            {t("home.recent")}
          </SectionTitle>
          <Card>
            <ul className="divide-y divide-border">
              {recent.map(({ match: m, tournament, delta }) => {
                return (
                  <li key={m.id} className="px-4 py-3 text-sm">
                    <div className="mb-1 text-xs text-muted">
                      {tournament.name} · {tg(m.label)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={m.winner === m.p1 ? "font-semibold" : ""}>
                        <PlayerName id={m.p1} />
                      </span>
                      <span className="text-xs">
                        <Delta value={delta[0]} />
                      </span>
                      <span className="mx-1 font-semibold tabular-nums">
                        {matchScoreText(m)}
                      </span>
                      <span className={m.winner === m.p2 ? "font-semibold" : ""}>
                        <PlayerName id={m.p2} />
                      </span>
                      <span className="text-xs">
                        <Delta value={delta[1]} />
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>
      </div>

      <p className="text-center text-xs text-muted">
        {t("home.demoNote")}{" "}
        <button
          onClick={() => {
            if (window.confirm(t("home.resetConfirm"))) resetDemo();
          }}
          className="text-accent hover:underline"
        >
          {t("home.reset")}
        </button>
      </p>
    </div>
  );
}
