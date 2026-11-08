"use client";

import { useState } from "react";
import type { Tournament } from "@/types";
import { Card, SectionTitle } from "@/components/ui";
import { useI18n } from "@/hooks/useI18n";

/** Вкладка «О турнире»: описание, призовой фонд и контакты — всё пишет организатор */
export default function TournamentInfo({ tournament: t }: { tournament: Tournament }) {
  const [copied, setCopied] = useState(false);
  const { t: tr } = useI18n();

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
          <SectionTitle>{tr("ti.description")}</SectionTitle>
          <Card className="whitespace-pre-line p-5 text-sm leading-relaxed">
            {t.description?.trim() || <span className="text-muted">{tr("ti.noDescription")}</span>}
          </Card>
        </section>
        <section>
          <SectionTitle>{tr("ti.prize")}</SectionTitle>
          <Card className="whitespace-pre-line p-5 text-sm leading-relaxed">
            {t.prizeFund?.trim() || <span className="text-muted">{tr("ti.notSet")}</span>}
          </Card>
        </section>
      </div>

      <div className="space-y-6">
        <section>
          <SectionTitle>{tr("ti.contacts")}</SectionTitle>
          <Card className="space-y-3 p-5 text-sm">
            <div>
              <div className="text-xs text-muted">{tr("ti.contactPerson")}</div>
              <div className="font-medium">{t.contactName || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted">{tr("ti.phone")}</div>
              <div className="font-medium tabular-nums">{t.contactPhone || "—"}</div>
            </div>
          </Card>
        </section>
        <section>
          <SectionTitle>{tr("ti.signup")}</SectionTitle>
          <Card className="space-y-3 p-5 text-sm">
            <p className="text-muted">
              {tr("ti.signupText")}
              {t.maxRating ? tr("ti.signupRating", { n: t.maxRating }) : ""}.
            </p>
            <button
              onClick={copyLink}
              className="w-full rounded-lg bg-accent px-4 py-2 font-medium text-white hover:opacity-90"
            >
              {copied ? tr("ti.copied") : tr("ti.copy")}
            </button>
          </Card>
        </section>
      </div>
    </div>
  );
}
