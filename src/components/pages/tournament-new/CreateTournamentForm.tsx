"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Format } from "@/types";
import { useData } from "@/components/providers/DataProvider";
import { Card, PageTitle } from "@/components/ui";
import { FORMAT_DESCRIPTIONS, FORMAT_LABELS } from "@/lib/labels";

const FORMATS: Format[] = ["round-robin", "single-elim", "groups-playoff"];

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-accent";

export default function CreateTournamentForm() {
  const router = useRouter();
  const { players, rating, createTournament } = useData();

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("Клуб Cheber Boll, Бишкек");
  const [format, setFormat] = useState<Format>("round-robin");
  const [bestOf, setBestOf] = useState<3 | 5>(5);
  const [groupCount, setGroupCount] = useState(2);
  const [advance, setAdvance] = useState(2);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const sortedPlayers = [...players].sort((a, b) => rating.ratings[b.id] - rating.ratings[a.id]);
  const minPlayers = format === "groups-playoff" ? groupCount * 3 : format === "single-elim" ? 4 : 3;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Введите название турнира");
    if (!date) return setError("Выберите дату");
    if (selected.size < minPlayers) return setError(`Для этого формата нужно минимум ${minPlayers} участников`);
    if (format === "groups-playoff" && advance * groupCount < 2) return setError("В плей-офф должно выйти минимум 2 игрока");

    // Посев по текущему рейтингу: сильнейший первым
    const playerIds = sortedPlayers.filter((p) => selected.has(p.id)).map((p) => p.id);
    const id = createTournament({
      name: name.trim(),
      date,
      venue: venue.trim() || "—",
      format,
      bestOf,
      playerIds,
      ...(format === "groups-playoff" ? { groupCount, advancePerGroup: advance } : {}),
    });
    router.push(`/tournaments/${id}`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="Новый турнир" subtitle="Сетка и таблицы построятся автоматически по рейтингу участников" />

      <form onSubmit={submit} className="space-y-6">
        <Card className="space-y-4 p-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Название</span>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Кубок декабря" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Дата</span>
              <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Место проведения</span>
              <input className={inputCls} value={venue} onChange={(e) => setVenue(e.target.value)} />
            </label>
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <div>
            <span className="mb-2 block text-sm font-medium">Формат</span>
            <div className="grid gap-3 sm:grid-cols-3">
              {FORMATS.map((f) => (
                <button
                  type="button"
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`rounded-xl border p-3 text-left transition ${
                    format === f ? "border-accent bg-accent-soft" : "border-border hover:border-foreground/30"
                  }`}
                >
                  <div className="font-medium">{FORMAT_LABELS[f]}</div>
                  <div className="mt-1 text-xs text-muted">{FORMAT_DESCRIPTIONS[f]}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Матч до</span>
              <select className={inputCls} value={bestOf} onChange={(e) => setBestOf(Number(e.target.value) as 3 | 5)}>
                <option value={3}>2 побед (из 3 партий)</option>
                <option value={5}>3 побед (из 5 партий)</option>
              </select>
            </label>
            {format === "groups-playoff" && (
              <>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Групп</span>
                  <select className={inputCls} value={groupCount} onChange={(e) => setGroupCount(Number(e.target.value))}>
                    {[2, 4].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Выходят из группы</span>
                  <select className={inputCls} value={advance} onChange={(e) => setAdvance(Number(e.target.value))}>
                    {[1, 2].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
              </>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">
              Участники <span className="text-muted">· выбрано {selected.size}, минимум {minPlayers}</span>
            </span>
            <button
              type="button"
              className="text-sm text-accent hover:underline"
              onClick={() =>
                setSelected(selected.size === players.length ? new Set() : new Set(players.map((p) => p.id)))
              }
            >
              {selected.size === players.length ? "Снять все" : "Выбрать всех"}
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {sortedPlayers.map((p) => (
              <label
                key={p.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                  selected.has(p.id) ? "border-accent bg-accent-soft" : "border-border"
                }`}
              >
                <input type="checkbox" className="accent-[var(--accent)]" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                <span className="flex-1">{p.name}</span>
                <span className="tabular-nums text-muted">{rating.ratings[p.id]}</span>
              </label>
            ))}
          </div>
        </Card>

        {error && <p className="rounded-lg bg-loss/10 px-4 py-3 text-sm text-loss">{error}</p>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-foreground/5">
            Отмена
          </button>
          <button type="submit" className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:opacity-90">
            Создать турнир
          </button>
        </div>
      </form>
    </div>
  );
}
