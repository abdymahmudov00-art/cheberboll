"use client";

import { useI18n } from "@/hooks/useI18n";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-[1200px] px-4 py-6 text-sm text-muted">
        <p>{t("footer")}</p>
      </div>
    </footer>
  );
}
