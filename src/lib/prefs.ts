/**
 * Настройки посетителя: тема и язык. Хранятся в браузере (localStorage).
 * Тема применяется атрибутом data-theme на <html>, язык — атрибутом lang.
 */

export type ThemePref = "system" | "light" | "dark";
export type Lang = "ru" | "ky";

export interface Prefs {
  theme: ThemePref;
  lang: Lang;
}

export const THEME_KEY = "cb-theme";
export const LANG_KEY = "cb-lang";
const DEFAULT: Prefs = { theme: "system", lang: "ru" };

let prefs: Prefs = DEFAULT;
let loaded = false;
const listeners = new Set<() => void>();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // хранилище недоступно: настройка действует до перезагрузки
  }
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const theme = read(THEME_KEY);
  const lang = read(LANG_KEY);
  prefs = {
    theme: theme === "light" || theme === "dark" ? theme : "system",
    lang: lang === "ky" ? "ky" : "ru",
  };
  apply();
}

function apply() {
  const root = document.documentElement;
  if (prefs.theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", prefs.theme);
  root.lang = prefs.lang;
}

function set(next: Prefs) {
  prefs = next;
  write(THEME_KEY, next.theme);
  write(LANG_KEY, next.lang);
  apply();
  listeners.forEach((l) => l());
}

export const prefsStore = {
  subscribe(listener: () => void) {
    load();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): Prefs {
    load();
    return prefs;
  },
  getServerSnapshot(): Prefs {
    return DEFAULT;
  },
  setTheme(theme: ThemePref) {
    set({ ...prefs, theme });
  },
  setLang(lang: Lang) {
    set({ ...prefs, lang });
  },
};

/** Скрипт для <head>: ставит тему и язык до первой отрисовки, чтобы страница не мигала */
export const PREFS_BOOT_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);var l=localStorage.getItem("${LANG_KEY}");if(l==="ky")document.documentElement.lang="ky"}catch(e){}`;
