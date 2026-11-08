"use client";

import { useSyncExternalStore } from "react";
import { prefsStore } from "@/lib/prefs";
import { formatDateL, plural, translate, translateGenerated, type TKey, type TVars } from "@/lib/i18n";

/** Текущий язык и функции перевода. До загрузки страницы в браузере — русский. */
export function useI18n() {
  const prefs = useSyncExternalStore(prefsStore.subscribe, prefsStore.getSnapshot, prefsStore.getServerSnapshot);
  const lang = prefs.lang;
  return {
    lang,
    /** Перевод по ключу словаря */
    t: (key: TKey, vars?: TVars) => translate(lang, key, vars),
    /** Перевод подписей, которые собрала логика турнира */
    tg: (text: string) => translateGenerated(lang, text),
    date: (iso: string) => formatDateL(lang, iso),
    plural: (n: number, ru3: [string, string, string], kyWord: string) => plural(lang, n, ru3, kyWord),
  };
}

export function usePrefs() {
  return useSyncExternalStore(prefsStore.subscribe, prefsStore.getSnapshot, prefsStore.getServerSnapshot);
}
