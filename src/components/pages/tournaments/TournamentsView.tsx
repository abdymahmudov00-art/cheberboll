"use client";

import { useState } from "react";
import type { TournamentStatus } from "@/types";
import { useData } from "@/components/providers/DataProvider";
import { ButtonLink, EmptyState, PageTitle } from "@/components/ui";
import TournamentCard from "./TournamentCard";

type Filter = "all" | TournamentStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "live", label: "Идут" },
  { key: "upcoming", label: "Предстоящие" },
  { key: "finished", label: "Завершённые" },
];

const ORDER: Record<TournamentStatus, number> = { live: 0, upcoming: 1, finished: 2 };

export default function TournamentsView() {
  const { tournaments, data } = useData();
  const [filter, setFilter] = useState<Filter>("all");

  const list = tournaments
    .map((t) => data[t.id])
    .filter((d) => d && (filter === "all" || d.status === filter))
    .sort((a, b) => {
      if (ORDER[a.status] !== ORDER[b.status]) return ORDER[a.status] - ORDER[b.status];
      // предстоящие — ближайшие первыми, остальные — свежие первыми
      return a.status === "upcoming"
        ? a.tournament.date.localeCompare(b.tournament.date)
        : b.tournament.date.localeCompare(a.tournament.date);
    });

  const count = (f: Filter) =>
    f === "all" ? tournaments.length : tournaments.filter((t) => data[t.id]?.status === f).length;

  return (
    <div>
      <PageTitle
        title="Турниры"
        subtitle="Расписание, таблицы и результаты"
        action={<ButtonLink href="/tournaments/new">+ Создать турнир</ButtonLink>}
      />

      <div className="mb-6 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition ${
              filter === f.key ? "bg-foreground text-background" : "border border-border bg-card text-muted hover:text-foreground"
            }`}
          >
            {f.label} <span className="opacity-60">{count(f.key)}</span>
          </button>
        ))}
      </div>

      {list.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((d) => (
            <TournamentCard key={d.tournament.id} data={d} />
          ))}
        </div>
      ) : (
        <EmptyState>В этой категории турниров нет</EmptyState>
      )}
    </div>
  );
}
