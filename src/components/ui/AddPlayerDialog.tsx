"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useData } from "@/components/providers/DataProvider";
import { useI18n } from "@/hooks/useI18n";

interface Props {
  onClose: () => void;
  /** Вызывается с id нового игрока */
  onCreated?: (id: string) => void;
}

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-accent";

/** Новый участник: как в программе RTTF — новичку рейтинг ставит организатор */
export default function AddPlayerDialog({ onClose, onCreated }: Props) {
  const { createPlayer } = useData();
  const { t } = useI18n();
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [rating, setRating] = useState("100");
  const [birthYear, setBirthYear] = useState("");
  const [city, setCity] = useState("Бишкек");
  const [hand, setHand] = useState<"" | "right" | "left">("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!lastName.trim() || !firstName.trim()) return setError(t("ap.errName"));
    const r = Number(rating);
    if (!rating.trim() || !Number.isFinite(r) || r < 0) return setError(t("ap.errRating"));
    const year = birthYear.trim() ? Number(birthYear) : undefined;
    if (year !== undefined && (!Number.isInteger(year) || year < 1920 || year > 2026)) {
      return setError(t("ap.errYear"));
    }
    const id = createPlayer({
      name: `${lastName.trim()} ${firstName.trim()}`,
      city: city.trim() || "—",
      startRating: Math.round(r),
      birthYear: year,
      hand: hand || undefined,
    });
    onCreated?.(id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl"
      >
        <h3 className="text-lg font-semibold">{t("ap.title")}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t("ap.last")}</span>
            <input autoFocus className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t("ap.first")}</span>
            <input className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t("ap.rating")}</span>
            <input inputMode="numeric" className={inputCls} value={rating} onChange={(e) => setRating(e.target.value.replace(/[^\d]/g, ""))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t("ap.birth")}</span>
            <input inputMode="numeric" className={inputCls} value={birthYear} onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder={t("ap.optional")} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t("ap.city")}</span>
          <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} />
        </label>
        <div>
          <span className="mb-1 block text-sm font-medium">{t("ap.hand")}</span>
          <div className="flex gap-2">
            {([["", t("ap.handNone")], ["right", t("ap.right")], ["left", t("ap.left")]] as const).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setHand(v)}
                className={`rounded-full border px-3 py-1 text-sm ${hand === v ? "border-accent bg-accent-soft text-accent" : "border-border"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted">{t("ap.note")}</p>
        {error && <p className="rounded-lg bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-foreground/5">
            {t("common.cancel")}
          </button>
          <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            {t("common.add")}
          </button>
        </div>
      </form>
    </div>
  );
}
