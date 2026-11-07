import type { BracketKind, Format, Match, TournamentKind, TournamentStatus } from "@/types";

export const FORMAT_LABELS: Record<Format, string> = {
  "round-robin": "Круговая",
  "round-robin-2": "Круговая в 2 круга",
  "single-elim": "Олимпийская система",
  "bracket-11": "Сетка (приложение 11)",
  "bracket-12": "Сетка (приложение 12)",
  "groups-playoff": "Группы + сетка",
  "groups-two-finals": "Группы + два финала",
  "groups-rr-finals": "Группы + финалы по кругу",
};

export const FORMAT_DESCRIPTIONS: Record<Format, string> = {
  "round-robin": "Каждый играет с каждым, места по таблице",
  "round-robin-2": "Каждый с каждым дважды",
  "single-elim": "Проигравший выбывает, места не разыгрываются",
  "bracket-11": "Проигравшие разыгрывают все места",
  "bracket-12": "Нижняя сетка: проигравший ещё может стать третьим",
  "groups-playoff": "Группы по кругу, лучшие выходят в сетку",
  "groups-two-finals": "Лучшие из групп — в финал 1, остальные — в финал 2",
  "groups-rr-finals": "Финалы по кругу, встречи из группы засчитываются",
};

/** Схемы, где после групп или сразу играется сетка */
export const BRACKET_FORMATS: Format[] = ["groups-playoff", "groups-two-finals"];
export const GROUP_FORMATS: Format[] = ["groups-playoff", "groups-two-finals", "groups-rr-finals"];

export const BRACKET_KIND_LABELS: Record<BracketKind, string> = {
  single: "Олимпийская (без розыгрыша мест)",
  p11: "Приложение 11 (все места)",
  p12: "Приложение 12 (нижняя сетка)",
};

export const KIND_LABELS: Record<TournamentKind, string> = {
  regular: "Обычный",
  doubles: "Парный",
  kids: "Детский",
  veterans: "Ветеранский",
  team: "Командный",
};

export const KINDS: TournamentKind[] = ["regular", "doubles", "kids", "veterans", "team"];

/** 1500 → «1 500 сом» */
export function formatMoney(n: number): string {
  return `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} сом`;
}

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

/** Счёт матча для показа: «3:1», «W:L» или «2:1» (подробный счёт по партиям — отдельно) */
export function matchScoreText(m: Match): string {
  if (m.walkover) return m.winner === m.p1 ? "W:L" : "L:W";
  if (m.score) return `${m.score[0]}:${m.score[1]}`;
  return "–";
}

/** Результат с точки зрения игрока: «2:1», «W», «L» */
export function scoreFor(m: Match, playerId: string): string {
  if (m.walkover) return m.winner === playerId ? "W" : "L";
  if (!m.score) return "";
  const [a, b] = m.score;
  return m.p1 === playerId ? `${a}:${b}` : `${b}:${a}`;
}
