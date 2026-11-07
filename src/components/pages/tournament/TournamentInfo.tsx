"use client";

import { useState } from "react";
import type { Tournament } from "@/types";
import { Card, SectionTitle } from "@/components/ui";

/** Вкладка «О турнире»: описание, призовой фонд и контакты — всё пишет организатор */
export default function TournamentInfo({ tournament: t }: { tournament: Tournament }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // буфер обмена недоступен — ссылку можно скопировать из адресной строки
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section>
          <SectionTitle>Описание</SectionTitle>
          <Card className="whitespace-pre-line p-5 text-sm leading-relaxed">
            {t.description?.trim() || <span className="text-muted">Организатор пока не добавил описание</span>}
          </Card>
        </section>
        <section>
          <SectionTitle>Призовой фонд</SectionTitle>
          <Card className="whitespace-pre-line p-5 text-sm leading-relaxed">
            {t.prizeFund?.trim() || <span className="text-muted">Не указан</span>}
          </Card>
        </section>
      </div>

      <div className="space-y-6">
        <section>
          <SectionTitle>Контакты</SectionTitle>
          <Card className="space-y-3 p-5 text-sm">
            <div>
              <div className="text-xs text-muted">Контактное лицо</div>
              <div className="font-medium">{t.contactName || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted">Телефон организатора</div>
              <div className="font-medium tabular-nums">{t.contactPhone || "—"}</div>
            </div>
          </Card>
        </section>
        <section>
          <SectionTitle>Запись</SectionTitle>
          <Card className="space-y-3 p-5 text-sm">
            <p className="text-muted">
              Игроки записываются по ссылке на турнир
              {t.maxRating ? `, если их рейтинг не выше ${t.maxRating}` : ""}.
            </p>
            <button
              onClick={copyLink}
              className="w-full rounded-lg bg-accent px-4 py-2 font-medium text-white hover:opacity-90"
            >
              {copied ? "Ссылка скопирована" : "Скопировать ссылку для записи"}
            </button>
          </Card>
        </section>
      </div>
    </div>
  );
}
