"use client";

import { prefsStore, type ThemePref } from "@/lib/prefs";
import { useI18n, usePrefs } from "@/hooks/useI18n";

const NEXT: Record<ThemePref, ThemePref> = { system: "light", light: "dark", dark: "system" };
const ICON: Record<ThemePref, string> = { system: "◐", light: "☀", dark: "☾" };

/** Переключатели в шапке: язык (RU / KG) и тема (как в системе → светлая → тёмная) */
export default function HeaderControls() {
  const prefs = usePrefs();
  const { t } = useI18n();
  const btn =
    "flex h-8 items-center justify-center rounded-lg border border-border px-2 text-sm text-muted transition hover:border-accent hover:text-foreground";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex overflow-hidden rounded-lg border border-border text-xs font-semibold" title={t("lang.title")}>
        {(["ru", "ky"] as const).map((l) => (
          <button
            key={l}
            onClick={() => prefsStore.setLang(l)}
            className={`px-2 py-1.5 transition ${prefs.lang === l ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}
          >
            {l === "ru" ? "RU" : "KG"}
          </button>
        ))}
      </div>
      <button
        onClick={() => prefsStore.setTheme(NEXT[prefs.theme])}
        className={`${btn} w-8`}
        title={t(`theme.${prefs.theme}`)}
        aria-label={t(`theme.${prefs.theme}`)}
      >
        <span aria-hidden>{ICON[prefs.theme]}</span>
      </button>
    </div>
  );
}
