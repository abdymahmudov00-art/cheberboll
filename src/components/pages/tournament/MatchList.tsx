"use client";

import type { Match } from "@/types";
import { useData } from "@/components/providers/DataProvider";
import { PlayerName } from "@/components/ui/PlayerName";
import { formatSets } from "@/lib/scoring";
import { matchScoreText } from "@/lib/labels";
import { useI18n } from "@/hooks/useI18n";

interface Props {
  matches: Match[];
  onMatchClick: (m: Match) => void;
  /** Турнир завершён: только просмотр счёта */
  readOnly?: boolean;
}

export default function MatchList({ matches, onMatchClick, readOnly = false }: Props) {
  const { live } = useData();
  const { t, tg } = useI18n();
  return (
    <ul className="divide-y divide-border">
      {matches.map((m) => {
        const playable = Boolean(m.p1 && m.p2);
        const table = live[m.id]?.table;
        return (
          <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
            <span className="w-full text-xs text-muted sm:w-44">
              {m.number ? `№${m.number} · ` : ""}
              {tg(m.label)}
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className={m.winner && m.winner === m.p1 ? "font-semibold" : ""}>
                <PlayerName id={m.p1} />
              </span>
              <span className="font-semibold tabular-nums">{matchScoreText(m)}</span>
              <span className={m.winner && m.winner === m.p2 ? "font-semibold" : ""}>
                <PlayerName id={m.p2} />
              </span>
            </span>
            {m.sets && <span className="hidden text-xs text-muted md:inline">{formatSets(m.sets)}</span>}
            {table && !m.winner && (
              <span className="rounded-full bg-win/15 px-2 py-0.5 text-xs font-medium text-win">{t("sd.table", { n: table })}</span>
            )}
            {playable && (
              <button
                onClick={() => onMatchClick(m)}
                className={`rounded-lg px-3 py-1 text-xs font-medium ${
                  m.winner ? "border border-border hover:bg-foreground/5" : "bg-accent text-white hover:opacity-90"
                }`}
              >
                {readOnly ? t("ml.view") : m.winner ? t("ml.edit") : t("ml.enter")}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
