"use client";

import { useState } from "react";
import Link from "next/link";
import type { Match } from "@/types";
import { useData } from "@/components/providers/DataProvider";
import { Card, EmptyState, SectionTitle, StatusBadge } from "@/components/ui";
import { PlayerName } from "@/components/ui/PlayerName";
import { formatMoney } from "@/lib/labels";
import { useI18n } from "@/hooks/useI18n";
import TournamentInfo from "./TournamentInfo";
import TableBoard from "./TableBoard";
import { setsToWin } from "@/lib/scoring";
import CrossTable from "./CrossTable";
import Bracket from "./Bracket";
import MatchList from "./MatchList";
import ScoreDialog from "./ScoreDialog";

type Tab = "info" | "live" | "tables" | `bracket-${number}` | "matches" | "players";

export default function TournamentView({ id }: { id: string }) {
  const { data, rating, unlocked, setUnlocked } = useData();
  const { t: tr, tg, date, plural } = useI18n();
  const d = data[id];
  const [tab, setTab] = useState<Tab | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  if (!d) {
    return (
      <EmptyState>
        {tr("t.notFound")} <Link href="/tournaments" className="text-accent hover:underline">{tr("t.toList")}</Link>
      </EmptyState>
    );
  }

  const t = d.tournament;
  const hasTables = d.groups.length > 0;
  const isGroups = d.groups.some((g) => g.kind === "group");
  const groupsDone = d.groups.filter((g) => g.kind === "group").every((g) => g.complete);
  const tabs: { key: Tab; label: string }[] = [
    { key: "info", label: tr("tab.info") },
    ...(d.status !== "finished" ? [{ key: "live" as const, label: tr("tab.live") }] : []),
    ...(hasTables ? [{ key: "tables" as const, label: isGroups ? (d.groups.some((g) => g.kind === "final") ? tr("tab.groupsFinals") : tr("tab.groups")) : tr("tab.table") }] : []),
    ...d.brackets.map((b, i) => ({ key: `bracket-${i}` as const, label: tg(b.title) })),
    { key: "matches", label: tr("tab.matches") },
    { key: "players", label: tr("tab.players") },
  ];
  const mainTab: Tab = hasTables ? "tables" : d.brackets.length ? "bracket-0" : "matches";
  // Предстоящий турнир открывается на информации, остальные — на таблице или сетке
  const activeTab: Tab = tab && tabs.some((x) => x.key === tab) ? tab : d.status === "upcoming" ? "info" : mainTab;
  const bracketIndex = activeTab.startsWith("bracket-") ? Number(activeTab.slice(8)) : -1;
  const total = d.matches.length;
  const progress = total ? Math.round((d.playedCount / total) * 100) : 0;
  const champion = d.placements.find((p) => p.place === "1");

  // Завершённый турнир закрыт для изменений, пока организатор не откроет его для правок
  const locked = d.status === "finished" && !unlocked[id];
  const editing = Boolean(unlocked[id]);

  const openMatch = (m: Match) => {
    if (m.p1 && m.p2 && !m.bye) setEditingMatch(m);
  };

  return (
    <div>
      <Link href="/tournaments" className="mb-4 inline-block text-sm text-muted hover:text-accent">
        {tr("t.back")}
      </Link>

      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={d.status} />
              {t.kind && (
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">{tr(`kind.${t.kind}`)}</span>
              )}
              <span className="text-sm text-muted">{tr(`format.${t.format}`)}</span>
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">{t.name}</h1>
            <p className="mt-1 text-muted">
              {date(t.date)}
              {t.time && `, ${t.time}`} · {t.venue}
            </p>
            <p className="mt-1 text-sm text-muted">
              {plural(t.playerIds.length, ["участник", "участника", "участников"], "катышуучу")} ·{" "}
              {tr("t.matchesTo", { n: setsToWin(t.bestOf) })}
              {isGroups &&
                ` · ${tr("t.groupsInfo", {
                  g: plural(t.groupCount ?? 2, ["группа", "группы", "групп"], "топ"),
                  a: t.advancePerGroup ?? 2,
                })}`}
            </p>
          </div>
          {champion ? (
            <div className="rounded-xl bg-accent-soft px-4 py-3 text-right">
              <div className="text-xs uppercase tracking-wide text-accent">{tr("t.winner")}</div>
              <div className="text-lg font-semibold">
                <PlayerName id={champion.playerId} />
              </div>
            </div>
          ) : (
            <div className="min-w-48 text-right">
              <div className="text-sm text-muted">
                {tr("card.played", { a: d.playedCount, b: total })}
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-foreground/10">
                <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
          {[
            [tr("info.start"), t.time ?? "—"],
            [tr("info.warmup"), t.warmupTime ? tr("info.warmupFrom", { t: t.warmupTime }) : "—"],
            [tr("info.fee"), t.fee !== undefined ? formatMoney(t.fee) : "—"],
            [tr("info.players"), `${t.playerIds.length}${t.playerLimit ? ` / ${t.playerLimit}` : ""}`],
            [tr("info.rating"), t.maxRating ? tr("info.ratingUpTo", { n: t.maxRating }) : tr("info.open")],
            [tr("info.contact"), t.contactPhone ?? "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        {(locked || editing) && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-sm text-muted">{editing ? tr("t.editing") : tr("sd.readOnly")}</p>
            <button
              onClick={() => {
                if (editing) setUnlocked(id, false);
                else if (window.confirm(tr("t.unlockConfirm"))) setUnlocked(id, true);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                editing ? "bg-accent text-white hover:opacity-90" : "border border-border hover:border-accent"
              }`}
            >
              {editing ? tr("t.lock") : tr("t.unlock")}
            </button>
          </div>
        )}
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

      {activeTab === "info" && <TournamentInfo tournament={t} />}

      {activeTab === "live" && <TableBoard data={d} onMatchClick={openMatch} />}

      {activeTab === "tables" && (
        <div className="space-y-6">
          {t.format === "groups-rr-finals" && !d.groups.some((g) => g.kind === "final") && (
            <p className="rounded-lg bg-accent-soft px-4 py-3 text-sm text-accent">
              {tr("t.rrFinalsPending")}
            </p>
          )}
          {d.groups.map((g) => (
            <section key={g.name}>
              <SectionTitle>
                {tg(g.name)}
                {g.kind === "final" && (
                  <span className="ml-2 text-sm font-normal text-muted">
                    {tr("t.finalPlaces", { a: g.placeOffset + 1, b: g.placeOffset + g.playerIds.length })}
                  </span>
                )}
              </SectionTitle>
              <Card className="p-4">
                <div className="mb-2 text-sm font-medium text-muted">{tr("t.crossHint")}</div>
                <CrossTable
                  standings={g.standings}
                  matches={g.matches}
                  onMatchClick={openMatch}
                  placeOffset={g.placeOffset}
                />
              </Card>
            </section>
          ))}
        </div>
      )}

      {bracketIndex >= 0 && d.brackets[bracketIndex] && (
        <div>
          {isGroups && !groupsDone && (
            <p className="mb-4 rounded-lg bg-accent-soft px-4 py-3 text-sm text-accent">
              {tr("t.bracketPending")}
            </p>
          )}
          <Card className="p-4">
            <Bracket bracket={d.brackets[bracketIndex]} onMatchClick={openMatch} />
          </Card>
        </div>
      )}

      {activeTab === "matches" && (
        <Card>
          {d.matches.length ? (
            <MatchList matches={d.matches} onMatchClick={openMatch} readOnly={locked} />
          ) : (
            <div className="p-6 text-muted">{tr("t.noMatches")}</div>
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
                  {place && <span className="w-16 text-right font-semibold">{tr("t.place", { p: place })}</span>}
                </li>
              );
            })}
          </ul>
          <p className="border-t border-border px-4 py-3 text-xs text-muted">{tr("t.seedNote")}</p>
        </Card>
      )}

      {editingMatch && <ScoreDialog match={editingMatch} bestOf={t.bestOf} onClose={() => setEditingMatch(null)} readOnly={locked} />}
    </div>
  );
}
