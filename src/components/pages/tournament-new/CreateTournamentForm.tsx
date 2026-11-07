"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { BracketKind, Format, TournamentKind } from "@/types";
import { useData } from "@/components/providers/DataProvider";
import { Card, PageTitle } from "@/components/ui";
import {
  BRACKET_FORMATS,
  BRACKET_KIND_LABELS,
  FORMAT_DESCRIPTIONS,
  FORMAT_LABELS,
  GROUP_FORMATS,
  KINDS,
  KIND_LABELS,
} from "@/lib/labels";
import AddPlayerDialog from "@/components/ui/AddPlayerDialog";

const FORMATS: Format[] = [
  "round-robin",
  "round-robin-2",
  "bracket-11",
  "bracket-12",
  "single-elim",
  "groups-playoff",
  "groups-two-finals",
  "groups-rr-finals",
];

const DEMO_PHONE = "+996 000 000 000";

/** "12" → 12, "" → undefined */
function toNumber(v: string): number | undefined {
  const n = Number(v);
  return v.trim() !== "" && Number.isFinite(n) && n >= 0 ? Math.round(n) : undefined;
}

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-accent";

export default function CreateTournamentForm() {
  const router = useRouter();
  const { players, rating, createTournament } = useData();

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [warmupTime, setWarmupTime] = useState("09:30");
  const [kind, setKind] = useState<TournamentKind>("regular");
  const [fee, setFee] = useState("");
  const [playerLimit, setPlayerLimit] = useState("");
  const [maxRating, setMaxRating] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState(DEMO_PHONE);
  const [prizeFund, setPrizeFund] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("Клуб Cheber Boll, Бишкек");
  const [format, setFormat] = useState<Format>("round-robin");
  const [bestOf, setBestOf] = useState<3 | 5>(5);
  const [groupCount, setGroupCount] = useState(2);
  const [advance, setAdvance] = useState(2);
  const [bracketKind, setBracketKind] = useState<BracketKind>("p12");
  const [tables, setTables] = useState("4");
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const sortedPlayers = [...players].sort((a, b) => rating.ratings[b.id] - rating.ratings[a.id]);
  const limit = toNumber(playerLimit);
  const ratingCap = toNumber(maxRating);
  const allowed = (id: string) => ratingCap === undefined || rating.ratings[id] <= ratingCap;
  const isGroups = GROUP_FORMATS.includes(format);
  const minPlayers = isGroups ? groupCount * 3 : format === "round-robin" || format === "round-robin-2" ? 3 : 4;

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
    if (!time) return setError("Укажите время начала");
    if (limit !== undefined && selected.size > limit) {
      return setError(`Выбрано ${selected.size} участников, а лимит — ${limit}`);
    }
    const tooStrong = [...selected].filter((id) => !allowed(id));
    if (tooStrong.length) return setError(`У ${tooStrong.length} выбранных игроков рейтинг выше ${ratingCap}`);
    if (selected.size < minPlayers) return setError(`Для этого формата нужно минимум ${minPlayers} участников`);
    if (isGroups && advance * groupCount < 2) return setError("Из групп должно выйти минимум 2 игрока");

    // Посев по текущему рейтингу: сильнейший первым
    const playerIds = sortedPlayers.filter((p) => selected.has(p.id)).map((p) => p.id);
    const id = createTournament({
      name: name.trim(),
      date,
      venue: venue.trim() || "—",
      format,
      bestOf,
      playerIds,
      time,
      warmupTime: warmupTime || undefined,
      kind,
      fee: toNumber(fee),
      playerLimit: limit,
      maxRating: ratingCap,
      contactName: contactName.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      prizeFund: prizeFund.trim() || undefined,
      description: description.trim() || undefined,
      tables: toNumber(tables) || 1,
      ...(isGroups ? { groupCount, advancePerGroup: advance } : {}),
      ...(BRACKET_FORMATS.includes(format) ? { bracketKind } : {}),
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
          <div>
            <span className="mb-2 block text-sm font-medium">Тип турнира</span>
            <div className="flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setKind(k)}
                  className={`rounded-full border px-4 py-1.5 text-sm transition ${
                    kind === k ? "border-accent bg-accent-soft text-accent" : "border-border hover:border-foreground/30"
                  }`}
                >
                  {KIND_LABELS[k]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Дата</span>
              <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Начало турнира</span>
              <input type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Начало разминки</span>
              <input type="time" className={inputCls} value={warmupTime} onChange={(e) => setWarmupTime(e.target.value)} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Место проведения</span>
            <input className={inputCls} value={venue} onChange={(e) => setVenue(e.target.value)} />
          </label>
        </Card>

        <Card className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Взнос, сом</span>
              <input inputMode="numeric" className={inputCls} value={fee} onChange={(e) => setFee(e.target.value.replace(/\D/g, ""))} placeholder="Например, 500" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Лимит участников</span>
              <input inputMode="numeric" className={inputCls} value={playerLimit} onChange={(e) => setPlayerLimit(e.target.value.replace(/\D/g, ""))} placeholder="Без лимита" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Рейтинг до</span>
              <input inputMode="numeric" className={inputCls} value={maxRating} onChange={(e) => setMaxRating(e.target.value.replace(/\D/g, ""))} placeholder="Открытый" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Контактное лицо</span>
              <input className={inputCls} value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Имя организатора" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Телефон организатора</span>
              <input type="tel" className={inputCls} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Призовой фонд</span>
            <textarea rows={3} className={inputCls} value={prizeFund} onChange={(e) => setPrizeFund(e.target.value)} placeholder={"1 место — 3 000 сом\n2 место — 2 000 сом"} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Описание</span>
            <textarea rows={4} className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Регламент, форма одежды, что взять с собой" />
          </label>
        </Card>

        <Card className="space-y-4 p-5">
          <div>
            <span className="mb-2 block text-sm font-medium">Формат</span>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Столов в зале</span>
              <input inputMode="numeric" className={inputCls} value={tables} onChange={(e) => setTables(e.target.value.replace(/\D/g, "").slice(0, 2))} />
            </label>
            {isGroups && (
              <>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Групп</span>
                  <select className={inputCls} value={groupCount} onChange={(e) => setGroupCount(Number(e.target.value))}>
                    {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">
                    {format === "groups-playoff" ? "Выходят в сетку из группы" : "В финал 1 из группы"}
                  </span>
                  <select className={inputCls} value={advance} onChange={(e) => setAdvance(Number(e.target.value))}>
                    {[1, 2, 3].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {BRACKET_FORMATS.includes(format) && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Сетка</span>
                <select className={inputCls} value={bracketKind} onChange={(e) => setBracketKind(e.target.value as BracketKind)}>
                  {(Object.keys(BRACKET_KIND_LABELS) as BracketKind[]).map((k) => (
                    <option key={k} value={k}>{BRACKET_KIND_LABELS[k]}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">
              Участники{" "}
              <span className="text-muted">
                · выбрано {selected.size}
                {limit !== undefined ? ` из ${limit}` : ""}, минимум {minPlayers}
              </span>
            </span>
            <div className="flex gap-4">
            <button type="button" className="text-sm text-accent hover:underline" onClick={() => setAddingPlayer(true)}>
              + Новый игрок
            </button>
            <button
              type="button"
              className="text-sm text-accent hover:underline"
              onClick={() =>
                setSelected(
                  selected.size > 0
                    ? new Set()
                    : new Set(sortedPlayers.filter((p) => allowed(p.id)).map((p) => p.id).slice(0, limit)),
                )
              }
            >
              {selected.size > 0 ? "Снять все" : "Выбрать всех"}
            </button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {sortedPlayers.map((p) => {
              const ok = allowed(p.id);
              return (
                <label
                  key={p.id}
                  title={ok ? undefined : `Рейтинг выше ${ratingCap}`}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                    selected.has(p.id) ? "border-accent bg-accent-soft" : "border-border"
                  } ${ok ? "cursor-pointer" : "cursor-not-allowed opacity-40"}`}
                >
                  <input
                    type="checkbox"
                    className="accent-[var(--accent)]"
                    checked={selected.has(p.id)}
                    disabled={!ok && !selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                  />
                  <span className="flex-1">{p.name}</span>
                  <span className="tabular-nums text-muted">{rating.ratings[p.id]}</span>
                </label>
              );
            })}
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
      {addingPlayer && (
        <AddPlayerDialog
          onClose={() => setAddingPlayer(false)}
          onCreated={(pid) => setSelected((prev) => new Set(prev).add(pid))}
        />
      )}
    </div>
  );
}
