"use client";

import Link from "next/link";
import type { TournamentData } from "@/types";
import { StatusBadge } from "@/components/ui";
import { useData } from "@/components/providers/DataProvider";
import { FORMAT_LABELS, KIND_LABELS, formatDate, formatMoney } from "@/lib/labels";

export default function TournamentCard({ data }: { data: TournamentData }) {
  const { playerById } = useData();
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
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">{KIND_LABELS[t.kind]}</span>
          )}
        </div>
        <span className="text-right text-xs text-muted">
          {formatDate(t.date)}
          {t.time && `, ${t.time}`}
        </span>
      </div>
      <h3 className="text-lg font-semibold group-hover:text-accent">{t.name}</h3>
      <p className="mt-1 text-sm text-muted">{t.venue}</p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
        <span>{FORMAT_LABELS[t.format]}</span>
        <span>{t.maxRating ? `рейтинг до ${t.maxRating}` : "открытый"}</span>
        {t.fee !== undefined && <span>взнос {formatMoney(t.fee)}</span>}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3 text-sm">
        {champion ? (
          <span>
            🏆 <span className="font-medium">{playerById[champion.playerId]?.name}</span>
          </span>
        ) : data.status === "live" ? (
          <span className="text-accent">
            Сыграно {data.playedCount} из {total}
          </span>
        ) : (
          <span className="text-muted">Регистрация открыта</span>
        )}
        <span className="tabular-nums text-muted" title="Записано / лимит участников">
          👤 {t.playerIds.length}
          {t.playerLimit ? `/${t.playerLimit}` : ""}
        </span>
      </div>
    </Link>
  );
}
