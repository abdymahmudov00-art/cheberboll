"use client";

import { useEffect, useState } from "react";
import type { Match, MatchResult, SetScore } from "@/types";
import { useData } from "@/components/providers/DataProvider";
import { countSets, quickScores, resultError, setsToWin } from "@/lib/scoring";

interface Props {
  match: Match;
  bestOf: number;
  onClose: () => void;
}

type Row = [string, string];

/** Быстрый выбор: итог по партиям или неявка */
type Quick = { type: "score"; score: [number, number] } | { type: "walkover"; winner: 1 | 2 } | null;

function initialQuick(r: MatchResult | null): Quick {
  if (!r || r.type === "sets") return null;
  return r;
}

export default function ScoreDialog({ match, bestOf, onClose }: Props) {
  const { playerById, setMatchResult, live, cancelMatch } = useData();
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
      setError("Выберите счёт кнопкой или введите партии");
      return;
    }
    const err = resultError(result, bestOf);
    if (err) {
      setError(err);
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
        aria-label="Ввод счёта матча"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between gap-2 text-sm text-muted">
          <span>
            {match.number ? `Матч ${match.number} · ` : ""}
            {match.label}
          </span>
          {table && <span className="rounded-full bg-win/15 px-2 py-0.5 text-xs font-medium text-win">Стол {table}</span>}
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
        <p className="mt-2 text-xs text-muted">W:L — неявка соперника (техническая победа, рейтинг не меняется).</p>

        <details className="mt-4 rounded-lg border border-border px-3 py-2" open={hasSets}>
          <summary className="cursor-pointer text-sm font-medium">Счёт по партиям (необязательно)</summary>
          <div className="mt-3 space-y-2">
            {rows.map(([a, b], i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <input
                  inputMode="numeric"
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-center tabular-nums outline-none focus:border-accent"
                  value={a}
                  onChange={(e) => updateCell(i, 0, e.target.value.replace(/\D/g, ""))}
                  aria-label={`Партия ${i + 1}, ${p1}`}
                />
                <span className="w-16 text-center text-xs text-muted">партия {i + 1}</span>
                <input
                  inputMode="numeric"
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-center tabular-nums outline-none focus:border-accent"
                  value={b}
                  onChange={(e) => updateCell(i, 1, e.target.value.replace(/\D/g, ""))}
                  aria-label={`Партия ${i + 1}, ${p2}`}
                />
              </div>
            ))}
            <p className="text-xs text-muted">
              Матч до {setsToWin(bestOf)} побед. Партия до 11, при 10:10 — до перевеса в 2 очка.
            </p>
          </div>
        </details>

        {error && <p className="mt-3 rounded-lg bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p>}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {match.winner && (
            <button onClick={clear} className="mr-auto rounded-lg px-3 py-2 text-sm text-loss hover:bg-loss/10">
              Удалить результат
            </button>
          )}
          {!match.winner && table && (
            <button onClick={cancelGame} className="mr-auto rounded-lg px-3 py-2 text-sm text-loss hover:bg-loss/10">
              Отменить игру
            </button>
          )}
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-foreground/5">
            Отмена
          </button>
          <button onClick={save} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
