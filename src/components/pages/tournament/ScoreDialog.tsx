"use client";

import { useEffect, useState } from "react";
import type { Match, SetScore } from "@/types";
import { useData } from "@/components/providers/DataProvider";
import { countSets, matchResultError, setsToWin } from "@/lib/scoring";

interface Props {
  match: Match;
  bestOf: number;
  onClose: () => void;
}

type Row = [string, string];

export default function ScoreDialog({ match, bestOf, onClose }: Props) {
  const { playerById, setMatchScore } = useData();
  const [rows, setRows] = useState<Row[]>(() => {
    const filled: Row[] = (match.sets ?? []).map(([a, b]) => [String(a), String(b)]);
    while (filled.length < bestOf) filled.push(["", ""]);
    return filled;
  });
  const [error, setError] = useState<string | null>(null);

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
  const [w1, w2] = countSets(parsed.filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b)));

  function updateCell(i: number, side: 0 | 1, value: string) {
    setError(null);
    setRows((prev) => prev.map((r, idx) => (idx === i ? (side === 0 ? [value, r[1]] : [r[0], value]) : r)));
  }

  function save() {
    const err = matchResultError(parsed, bestOf);
    if (err) {
      setError(err);
      return;
    }
    setMatchScore(match.id, parsed);
    onClose();
  }

  function clear() {
    setMatchScore(match.id, null);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ввод счёта матча"
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 text-sm text-muted">{match.label}</div>
        <h3 className="mb-4 text-lg font-semibold">Счёт матча</h3>

        <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
          <div className="font-medium">{p1}</div>
          <div className="text-2xl font-bold tabular-nums">
            {w1}:{w2}
          </div>
          <div className="font-medium">{p2}</div>
        </div>

        <div className="space-y-2">
          {rows.map(([a, b], i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <input
                inputMode="numeric"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-center tabular-nums outline-none focus:border-accent"
                value={a}
                onChange={(e) => updateCell(i, 0, e.target.value.replace(/\D/g, ""))}
                aria-label={`Партия ${i + 1}, ${p1}`}
              />
              <span className="w-16 text-center text-xs text-muted">партия {i + 1}</span>
              <input
                inputMode="numeric"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-center tabular-nums outline-none focus:border-accent"
                value={b}
                onChange={(e) => updateCell(i, 1, e.target.value.replace(/\D/g, ""))}
                aria-label={`Партия ${i + 1}, ${p2}`}
              />
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-muted">
          Матч до {setsToWin(bestOf)} побед. Партия до 11, при 10:10 — до перевеса в 2 очка. Лишние строки оставьте пустыми.
        </p>
        {error && <p className="mt-3 rounded-lg bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p>}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {match.winner && (
            <button onClick={clear} className="mr-auto rounded-lg px-3 py-2 text-sm text-loss hover:bg-loss/10">
              Удалить результат
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
