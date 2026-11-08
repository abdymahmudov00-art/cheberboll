"use client";

import Link from "next/link";
import type { TournamentData } from "@/types";
import { StatusBadge } from "@/components/ui";
import { useData } from "@/components/providers/DataProvider";
import { formatMoney } from "@/lib/labels";
import { useI18n } from "@/hooks/useI18n";

export default function TournamentCard({ data }: { data: TournamentData }) {
  const { playerById } = useData();
  const { t: tr, date } = useI18n();
  const t = data.tournament;
  const champion = data.placements.find((p) => p.place === "1");
  const total = data.matches.length;

  return (
    <Link
      href={`/tournaments/${t.id}`}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 transition hover:border-accent"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={data.status} />
          {t.kind && (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">{tr(`kind.${t.kind}`)}</span>
          )}
        </div>
        <span className="text-right text-xs text-muted">
          {date(t.date)}
          {t.time && `, ${t.time}`}
        </span>
      </div>
      <h3 className="text-lg font-semibold group-hover:text-accent">{t.name}</h3>
      <p className="mt-1 text-sm text-muted">{t.venue}</p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
        <span>{tr(`format.${t.format}`)}</span>
        <span>{t.maxRating ? tr("card.ratingUpTo", { n: t.maxRating }) : tr("card.open")}</span>
        {t.fee !== undefined && <span>{tr("card.fee", { fee: formatMoney(t.fee) })}</span>}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3 text-sm">
        {champion ? (
          <span>
            🏆 <span className="font-medium">{playerById[champion.playerId]?.name}</span>
          </span>
        ) : data.status === "live" ? (
          <span className="text-accent">
            {tr("card.played", { a: data.playedCount, b: total })}
          </span>
        ) : (
          <span className="text-muted">{tr("card.registration")}</span>
        )}
        <span className="tabular-nums text-muted" title={tr("card.limitTitle")}>
          👤 {t.playerIds.length}
          {t.playerLimit ? `/${t.playerLimit}` : ""}
        </span>
      </div>
    </Link>
  );
}
