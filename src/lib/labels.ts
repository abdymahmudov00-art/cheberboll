import type { Format, TournamentStatus } from "@/types";

export const FORMAT_LABELS: Record<Format, string> = {
  "round-robin": "Круговая система",
  "single-elim": "Олимпийская система",
  "groups-playoff": "Группы + плей-офф",
};

export const FORMAT_DESCRIPTIONS: Record<Format, string> = {
  "round-robin": "Каждый играет с каждым, места по таблице",
  "single-elim": "Проигравший выбывает, сетка на выбывание",
  "groups-playoff": "Сначала группы по кругу, лучшие выходят в сетку",
};

export const STATUS_LABELS: Record<TournamentStatus, string> = {
  upcoming: "Предстоит",
  live: "Идёт",
  finished: "Завершён",
};

const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

/** 2026-11-07 → «7 ноября 2026» */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function groupLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export function pluralRu(n: number, one: string, few: string, many: string): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}
