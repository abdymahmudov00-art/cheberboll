"use client";

import { useEffect, useState } from "react";
import type { Match, TournamentData } from "@/types";
import { useData } from "@/components/providers/DataProvider";
import { Card, SectionTitle } from "@/components/ui";
import { useI18n } from "@/hooks/useI18n";

interface Props {
  data: TournamentData;
  onMatchClick: (m: Match) => void;
}

/** Текущее время, обновляется раз в 15 секунд (для минут за столом) */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/**
 * Ход турнира: столы зала («Играется») и очередь матчей («В ожидании»).
 * Нажмите на матч в очереди — пара уходит на первый свободный стол.
 */
export default function TableBoard({ data: d, onMatchClick }: Props) {
  const { playerById, live, startMatch } = useData();
  const { t, tg } = useI18n();
  const now = useNow();
  const tableCount = d.tournament.tables ?? 4;

  const playing = d.matches.filter((m) => !m.winner && live[m.id]);
  const busyTables = new Set(playing.map((m) => live[m.id].table));
  const busyPlayers = new Set(playing.flatMap((m) => [m.p1, m.p2]));
  const waiting = d.matches.filter((m) => m.p1 && m.p2 && !m.winner && !live[m.id]);
  const freeTable = Array.from({ length: tableCount }, (_, i) => i + 1).find((n) => !busyTables.has(n));

  const name = (id: string | null) => (id ? (playerById[id]?.name ?? "—") : "—");
  const minutes = (m: Match) => Math.max(0, Math.floor((now - live[m.id].startedAt) / 60000));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section>
        <SectionTitle>{t("tb.playing")}</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: tableCount }, (_, i) => i + 1).map((n) => {
            const m = playing.find((x) => live[x.id].table === n);
            return (
              <Card key={n} className={`p-3 ${m ? "border-win" : ""}`}>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className={`font-semibold ${m ? "text-win" : "text-muted"}`}>{t("sd.table", { n })}</span>
                  {m && <span className="tabular-nums text-muted">{t("tb.min", { n: minutes(m) })}</span>}
                </div>
                {m ? (
                  <button onClick={() => onMatchClick(m)} className="w-full text-left text-sm hover:text-accent">
                    <div className="truncate font-medium">{name(m.p1)}</div>
                    <div className="truncate font-medium">{name(m.p2)}</div>
                    <div className="mt-1 truncate text-xs text-muted">{tg(m.label)}</div>
                  </button>
                ) : (
                  <div className="py-3 text-center text-sm text-muted">{t("tb.free")}</div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle>
          {t("tb.waiting")} <span className="text-sm font-normal text-muted">· {waiting.length}</span>
        </SectionTitle>
        <Card>
          {waiting.length === 0 ? (
            <p className="p-5 text-sm text-muted">{t("tb.none")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {waiting.map((m) => {
                const busy = busyPlayers.has(m.p1) || busyPlayers.has(m.p2);
                const canStart = !busy && freeTable !== undefined;
                return (
                  <li key={m.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className={`truncate ${busy ? "text-loss" : ""}`}>
                        {name(m.p1)} — {name(m.p2)}
                      </div>
                      <div className="truncate text-xs text-muted">
                        {m.number ? `№${m.number} · ` : ""}
                        {tg(m.label)}
                        {busy && t("tb.busy")}
                      </div>
                    </div>
                    <button
                      disabled={!canStart}
                      onClick={() => freeTable && startMatch(m.id, freeTable)}
                      className="shrink-0 rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
                      title={freeTable === undefined ? t("tb.allBusy") : busy ? t("tb.playerBusy") : t("tb.toTable", { n: freeTable })}
                    >
                      {freeTable === undefined ? t("tb.noTable") : t("tb.toTable", { n: freeTable })}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <p className="mt-2 text-xs text-muted">
          {t("tb.hint")}
        </p>
      </section>
    </div>
  );
}
