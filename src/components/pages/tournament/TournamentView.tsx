"use client";

import { useState } from "react";
import Link from "next/link";
import type { Match } from "@/types";
import { useData } from "@/components/providers/DataProvider";
import { Card, EmptyState, SectionTitle, StatusBadge } from "@/components/ui";
import { PlayerName } from "@/components/ui/PlayerName";
import { FORMAT_LABELS, formatDate, pluralRu } from "@/lib/labels";
import { setsToWin } from "@/lib/scoring";
import StandingsTable from "./StandingsTable";
import CrossTable from "./CrossTable";
import Bracket from "./Bracket";
import MatchList from "./MatchList";
import ScoreDialog from "./ScoreDialog";

type Tab = "tables" | "bracket" | "matches" | "players";

export default function TournamentView({ id }: { id: string }) {
  const { data, rating } = useData();
  const d = data[id];
  const [tab, setTab] = useState<Tab | null>(null);
  const [editing, setEditing] = useState<Match | null>(null);

  if (!d) {
    return (
      <EmptyState>
        Турнир не найден. <Link href="/tournaments" className="text-accent hover:underline">К списку турниров</Link>
      </EmptyState>
    );
  }

  const t = d.tournament;
  const hasTables = d.groups.length > 0;
  const hasBracket = d.bracket !== null;
  const tabs: { key: Tab; label: string }[] = [
    ...(hasTables ? [{ key: "tables" as const, label: t.format === "groups-playoff" ? "Группы" : "Таблица" }] : []),
    ...(hasBracket ? [{ key: "bracket" as const, label: "Сетка" }] : []),
    { key: "matches", label: "Матчи" },
    { key: "players", label: "Участники" },
  ];
  const activeTab: Tab = tab ?? tabs[0].key;
  const total = d.matches.length;
  const progress = total ? Math.round((d.playedCount / total) * 100) : 0;
  const champion = d.placements.find((p) => p.place === "1");

  const openMatch = (m: Match) => {
    if (m.p1 && m.p2 && !m.bye) setEditing(m);
  };

  return (
    <div>
      <Link href="/tournaments" className="mb-4 inline-block text-sm text-muted hover:text-accent">
        ← Все турниры
      </Link>

      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={d.status} />
              <span className="text-sm text-muted">{FORMAT_LABELS[t.format]}</span>
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">{t.name}</h1>
            <p className="mt-1 text-muted">
              {formatDate(t.date)} · {t.venue}
            </p>
            <p className="mt-1 text-sm text-muted">
              {t.playerIds.length} {pluralRu(t.playerIds.length, "участник", "участника", "участников")} · матчи до{" "}
              {setsToWin(t.bestOf)} побед
              {t.format === "groups-playoff" &&
                ` · ${t.groupCount ?? 2} ${pluralRu(t.groupCount ?? 2, "группа", "группы", "групп")}, из каждой выходят ${t.advancePerGroup ?? 2}`}
            </p>
          </div>
          {champion ? (
            <div className="rounded-xl bg-accent-soft px-4 py-3 text-right">
              <div className="text-xs uppercase tracking-wide text-accent">Победитель</div>
              <div className="text-lg font-semibold">
                <PlayerName id={champion.playerId} />
              </div>
            </div>
          ) : (
            <div className="min-w-48 text-right">
              <div className="text-sm text-muted">
                Сыграно {d.playedCount} из {total}
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-foreground/10">
                <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((x) => (
          <button
            key={x.key}
            onClick={() => setTab(x.key)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
              activeTab === x.key ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      {activeTab === "tables" && (
        <div className="space-y-6">
          {d.groups.map((g) => (
            <section key={g.name}>
              <SectionTitle>{g.name}</SectionTitle>
              <Card className="mb-4">
                <StandingsTable
                  rows={g.standings}
                  highlightTop={t.format === "groups-playoff" ? (t.advancePerGroup ?? 2) : 3}
                />
              </Card>
              <Card className="p-4">
                <div className="mb-2 text-sm font-medium text-muted">Шахматка · нажмите на клетку, чтобы ввести счёт</div>
                <CrossTable
                  standings={g.standings}
                  matches={g.matches}
                  onMatchClick={openMatch}
                />
              </Card>
            </section>
          ))}
        </div>
      )}

      {activeTab === "bracket" && d.bracket && (
        <div>
          {t.format === "groups-playoff" && !d.groups.every((g) => g.complete) && (
            <p className="mb-4 rounded-lg bg-accent-soft px-4 py-3 text-sm text-accent">
              Сетка заполнится, когда будут сыграны все матчи в группах.
            </p>
          )}
          <Card className="p-4">
            <Bracket rounds={d.bracket} onMatchClick={openMatch} />
          </Card>
        </div>
      )}

      {activeTab === "matches" && (
        <Card>
          {d.matches.length ? (
            <MatchList matches={d.matches} onMatchClick={openMatch} />
          ) : (
            <div className="p-6 text-muted">Матчей пока нет</div>
          )}
        </Card>
      )}

      {activeTab === "players" && (
        <Card>
          <ul className="divide-y divide-border">
            {t.playerIds.map((pid, i) => {
              const place = d.placements.find((p) => p.playerId === pid)?.place;
              return (
                <li key={pid} className="flex items-center gap-4 px-4 py-3 text-sm">
                  <span className="w-6 text-muted">{i + 1}</span>
                  <span className="flex-1">
                    <PlayerName id={pid} />
                  </span>
                  <span className="tabular-nums text-muted">{rating.ratings[pid]}</span>
                  {place && <span className="w-14 text-right font-semibold">{place} место</span>}
                </li>
              );
            })}
          </ul>
          <p className="border-t border-border px-4 py-3 text-xs text-muted">Номер — позиция в посеве.</p>
        </Card>
      )}

      {editing && <ScoreDialog match={editing} bestOf={t.bestOf} onClose={() => setEditing(null)} />}
    </div>
  );
}
