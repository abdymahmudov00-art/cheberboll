"use client";

import type { BracketData, Match } from "@/types";
import { useData } from "@/components/providers/DataProvider";
import { useI18n } from "@/hooks/useI18n";

interface Props {
  bracket: BracketData;
  onMatchClick: (m: Match) => void;
}

export default function Bracket({ bracket, onMatchClick }: Props) {
  const { t, tg } = useI18n();
  return (
    <div className="space-y-6">
      <div className="text-xs text-muted">{t(`bracketKind.${bracket.kind}`)}</div>
      {bracket.sections.map((section) => (
        <section key={section.title}>
          <div className="mb-3 text-sm font-semibold">{tg(section.title)}</div>
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max gap-6">
              {section.columns.map((col) => (
                <div key={col.title} className="flex w-72 flex-col">
                  <div className="mb-3 inline-block self-start rounded-md bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
                    {tg(col.title)}
                  </div>
                  <div className="flex flex-1 flex-col justify-around gap-3">
                    {col.matches.map((m) => (
                      <BracketMatch key={m.id} match={m} onClick={() => onMatchClick(m)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

function BracketMatch({ match, onClick }: { match: Match; onClick: () => void }) {
  const { playerById, rating, live } = useData();
  const { t } = useI18n();
  const playable = Boolean(match.p1 && match.p2) && !match.bye;
  const table = live[match.id]?.table;

  const line = (id: string | null, side: 0 | 1) => {
    const isWinner = match.winner !== null && match.winner === id;
    const isLoser = match.winner !== null && id !== null && match.winner !== id;
    let mark = "";
    if (match.bye && id && match.winner === id) mark = "W";
    else if (match.walkover && id) mark = isWinner ? "W" : "L";
    else if (match.score) mark = String(match.score[side]);
    const from = match.from?.[side];
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 ${isLoser ? "text-muted" : ""}`}>
        {from && <span className="w-6 shrink-0 text-[10px] text-muted">{from}</span>}
        <span className={`min-w-0 flex-1 truncate ${isWinner ? "font-semibold" : ""}`}>
          {id ? playerById[id]?.name : <span className="text-muted">{match.bye ? "" : "—"}</span>}
        </span>
        {id && <span className="shrink-0 text-[10px] tabular-nums text-loss/80">R:{rating.ratings[id]}</span>}
        <span className={`w-4 shrink-0 text-right font-semibold tabular-nums ${isWinner ? "text-accent" : ""}`}>{mark}</span>
      </div>
    );
  };

  return (
    <button
      onClick={onClick}
      disabled={!playable}
      className={`flex w-full overflow-hidden rounded-lg border bg-card text-left text-sm transition ${
        table && !match.winner ? "border-win" : "border-border"
      } ${match.bye ? "opacity-60" : ""} ${playable ? "hover:border-accent" : "cursor-default"}`}
    >
      <div className="min-w-0 flex-1">
        {line(match.p1, 0)}
        <div className="border-t border-border" />
        {line(match.p2, 1)}
      </div>
      <div
        className={`flex w-9 shrink-0 flex-col items-center justify-center border-l border-border text-xs font-semibold ${
          table && !match.winner ? "bg-win text-white" : "bg-foreground/5 text-muted"
        }`}
        title={table ? t("sd.table", { n: table }) : t("sd.match", { n: match.number ?? "" })}
      >
        {match.number}
        {table && !match.winner && <span className="text-[9px] font-normal">{t("br.tableShort", { n: table })}</span>}
      </div>
    </button>
  );
}
