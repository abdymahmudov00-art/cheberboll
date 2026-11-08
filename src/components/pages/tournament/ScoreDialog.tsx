"use client";

import { useEffect, useState } from "react";
import type { Match, MatchResult, SetScore } from "@/types";
import { useData } from "@/components/providers/DataProvider";
import { countSets, quickScores, resultError, setsToWin } from "@/lib/scoring";
import { useI18n } from "@/hooks/useI18n";

interface Props {
  match: Match;
  bestOf: number;
  onClose: () => void;
  /** Только просмотр: турнир завершён и не открыт для правок */
  readOnly?: boolean;
}

type Row = [string, string];

/** Быстрый выбор: итог по партиям или неявка */
type Quick = { type: "score"; score: [number, number] } | { type: "walkover"; winner: 1 | 2 } | null;

function initialQuick(r: MatchResult | null): Quick {
  if (!r || r.type === "sets") return null;
  return r;
}

export default function ScoreDialog({ match, bestOf, onClose, readOnly = false }: Props) {
  const { playerById, setMatchResult, live, cancelMatch } = useData();
  const { t, tg } = useI18n();
  const maxSets = bestOf;
  const [rows, setRows] = useState<Row[]>(() => {
    const filled: Row[] = (match.sets ?? []).map(([a, b]) => [String(a), String(b)]);
    while (filled.length < maxSets) filled.push(["", ""]);
    return filled;
  });
  const [quick, setQuick] = useState<Quick>(() => initialQuick(match.result));
  const [error, setError] = useState<string | null>(null);
  const table = live[match.id]?.table;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const p1 = match.p1 ? playerById[match.p1]?.name : "—";
  const p2 = match.p2 ? playerById[match.p2]?.name : "—";

  if (readOnly) {
    const final = match.walkover
      ? match.winner === match.p1 ? "W:L" : "L:W"
      : match.score ? `${match.score[0]}:${match.score[1]}` : "–:–";
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("sd.aria")}
          className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-sm text-muted">
            {match.number ? `${t("sd.match", { n: match.number })} · ` : ""}
            {tg(match.label)}
          </div>
          <div className="mb-4 mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
            <div className={match.winner === match.p1 ? "font-semibold" : "text-muted"}>{p1}</div>
            <div className="min-w-16 text-3xl font-bold tabular-nums">{final}</div>
            <div className={match.winner === match.p2 ? "font-semibold" : "text-muted"}>{p2}</div>
          </div>
          {match.walkover ? (
            <p className="text-center text-sm text-muted">{t("sd.walkover")}</p>
          ) : match.sets?.length ? (
            <div className="flex flex-wrap justify-center gap-2">
              {match.sets.map(([a, b], i) => (
                <div key={i} className="rounded-lg bg-foreground/5 px-3 py-1.5 text-center">
                  <div className="text-[10px] text-muted">{t("sd.set", { n: i + 1 })}</div>
                  <div className="font-semibold tabular-nums">
                    {a}:{b}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted">{t("sd.noSets")}</p>
          )}
          <p className="mt-4 rounded-lg bg-foreground/5 px-3 py-2 text-center text-xs text-muted">{t("sd.readOnly")}</p>
          <div className="mt-4 flex justify-end">
            <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-foreground/5">
              {t("sd.close")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const parsed: SetScore[] = rows
    .filter(([a, b]) => a.trim() !== "" || b.trim() !== "")
    .map(([a, b]) => [Number(a), Number(b)]);
  const hasSets = parsed.length > 0;

  let shown = "–:–";
  if (hasSets) {
    const [w1, w2] = countSets(parsed.filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b)));
    shown = `${w1}:${w2}`;
  } else if (quick?.type === "score") shown = `${quick.score[0]}:${quick.score[1]}`;
  else if (quick?.type === "walkover") shown = quick.winner === 1 ? "W:L" : "L:W";

  function updateCell(i: number, side: 0 | 1, value: string) {
    setError(null);
    setQuick(null);
    setRows((prev) => prev.map((r, idx) => (idx === i ? (side === 0 ? [value, r[1]] : [r[0], value]) : r)));
  }

  function pickQuick(q: Quick) {
    setError(null);
    setQuick(q);
    setRows(Array.from({ length: maxSets }, () => ["", ""] as Row));
  }

  function save() {
    let result: MatchResult;
    if (hasSets) result = { type: "sets", sets: parsed };
    else if (quick) result = quick;
    else {
      setError(t("sd.pick"));
      return;
    }
    const err = resultError(result, bestOf);
    if (err) {
      setError(tg(err));
      return;
    }
    setMatchResult(match.id, result);
    onClose();
  }

  function clear() {
    setMatchResult(match.id, null);
    onClose();
  }

  function cancelGame() {
    cancelMatch(match.id);
    onClose();
  }

  const scores = quickScores(bestOf);
  const isPicked = (q: Quick) =>
    quick !== null && q !== null && JSON.stringify(quick) === JSON.stringify(q) && !hasSets;
  const quickBtn = (q: Quick, label: string) => (
    <button
      key={label}
      type="button"
      onClick={() => pickQuick(q)}
      className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold tabular-nums transition ${
        isPicked(q) ? "border-accent bg-accent text-white" : "border-border hover:border-accent"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("sd.aria")}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between gap-2 text-sm text-muted">
          <span>
            {match.number ? `${t("sd.match", { n: match.number })} · ` : ""}
            {tg(match.label)}
          </span>
          {table && <span className="rounded-full bg-win/15 px-2 py-0.5 text-xs font-medium text-win">{t("sd.table", { n: table })}</span>}
        </div>

        <div className="mb-4 mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
          <div className="font-semibold">{p1}</div>
          <div className="min-w-16 text-2xl font-bold tabular-nums">{shown}</div>
          <div className="font-semibold">{p2}</div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <div className="space-y-2">
            {scores.map(([w, l]) => quickBtn({ type: "score", score: [w, l] }, `${w}:${l}`))}
            {quickBtn({ type: "walkover", winner: 1 }, "W:L")}
          </div>
          <div className="space-y-2">
            {scores.map(([w, l]) => quickBtn({ type: "score", score: [l, w] }, `${l}:${w}`))}
            {quickBtn({ type: "walkover", winner: 2 }, "L:W")}
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">{t("sd.wlHint")}</p>

        <details className="mt-4 rounded-lg border border-border px-3 py-2" open={hasSets}>
          <summary className="cursor-pointer text-sm font-medium">{t("sd.setsTitle")}</summary>
          <div className="mt-3 space-y-2">
            {rows.map(([a, b], i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <input
                  inputMode="numeric"
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-center tabular-nums outline-none focus:border-accent"
                  value={a}
                  onChange={(e) => updateCell(i, 0, e.target.value.replace(/\D/g, ""))}
                  aria-label={`${t("sd.set", { n: i + 1 })}, ${p1}`}
                />
                <span className="w-16 text-center text-xs text-muted">{t("sd.set", { n: i + 1 })}</span>
                <input
                  inputMode="numeric"
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-center tabular-nums outline-none focus:border-accent"
                  value={b}
                  onChange={(e) => updateCell(i, 1, e.target.value.replace(/\D/g, ""))}
                  aria-label={`${t("sd.set", { n: i + 1 })}, ${p2}`}
                />
              </div>
            ))}
            <p className="text-xs text-muted">
              {t("sd.rules", { n: setsToWin(bestOf) })}
            </p>
          </div>
        </details>

        {error && <p className="mt-3 rounded-lg bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p>}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {match.winner && (
            <button onClick={clear} className="mr-auto rounded-lg px-3 py-2 text-sm text-loss hover:bg-loss/10">
              {t("sd.delete")}
            </button>
          )}
          {!match.winner && table && (
            <button onClick={cancelGame} className="mr-auto rounded-lg px-3 py-2 text-sm text-loss hover:bg-loss/10">
              {t("sd.cancelGame")}
            </button>
          )}
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-foreground/5">
            {t("common.cancel")}
          </button>
          <button onClick={save} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
