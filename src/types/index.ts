export type Format =
  | "round-robin"
  | "round-robin-2"
  | "single-elim"
  | "bracket-11"
  | "bracket-12"
  | "groups-playoff"
  | "groups-two-finals"
  | "groups-rr-finals";

/**
 * Вид сетки на выбывание:
 * single — олимпийская, места не разыгрываются;
 * p11 — «приложение 11»: проигравшие разыгрывают все места;
 * p12 — «приложение 12»: нижняя сетка, проигравший полуфиналист ещё может стать третьим.
 */
export type BracketKind = "single" | "p11" | "p12";

/** Тип турнира — только метка для игроков, на логику не влияет */
export type TournamentKind = "regular" | "doubles" | "kids" | "veterans" | "team";

/** Счёт одной партии: [очки первого игрока, очки второго игрока] */
export type SetScore = [number, number];

/** Результат матча */
export type MatchResult =
  /** счёт по партиям */
  | { type: "sets"; sets: SetScore[] }
  /** только итог по партиям, например 3:1 */
  | { type: "score"; score: [number, number] }
  /** неявка: техническая победа игрока 1 или 2 (W:L) */
  | { type: "walkover"; winner: 1 | 2 };

export interface Player {
  id: string;
  name: string;
  city: string;
  /** Рейтинг до первого турнира в системе */
  startRating: number;
  birthYear?: number;
  hand?: "right" | "left";
  /** Игрок добавлен в демо пользователем */
  createdByUser?: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  /** Дата в формате YYYY-MM-DD */
  date: string;
  venue: string;
  format: Format;
  /** Матч до 2 побед (3) или до 3 побед (5) */
  bestOf: 3 | 5;
  /** Игроки в порядке посева (сильнейший первым) */
  playerIds: string[];
  /** Для схем с группами */
  groupCount?: number;
  /** Сколько выходит из группы в сетку / в первый финал */
  advancePerGroup?: number;
  /** Вид сетки для схем с сеткой (по умолчанию p12) */
  bracketKind?: BracketKind;
  /** Количество столов в зале */
  tables?: number;
  /** Время начала, ЧЧ:ММ */
  time?: string;
  /** Начало разминки, ЧЧ:ММ */
  warmupTime?: string;
  kind?: TournamentKind;
  /** Взнос в сомах */
  fee?: number;
  /** Максимум участников */
  playerLimit?: number;
  /** Записаться могут игроки с рейтингом не выше этого. Пусто — открытый турнир */
  maxRating?: number;
  contactName?: string;
  contactPhone?: string;
  /** Призовой фонд — свободный текст организатора */
  prizeFund?: string;
  /** Описание: регламент, форма, что взять с собой */
  description?: string;
  /** Турнир создан пользователем в демо, а не взят из тестовых данных */
  createdByUser?: boolean;
}

export type Stage = "rr" | "group" | "playoff";

export interface Match {
  id: string;
  tournamentId: string;
  stage: Stage;
  group?: number;
  round: number;
  index: number;
  label: string;
  p1: string | null;
  p2: string | null;
  /** Свободный проход: соперника нет, игрок проходит дальше без игры */
  bye: boolean;
  result: MatchResult | null;
  /** Счёт по партиям, если вводили подробно */
  sets: SetScore[] | null;
  /** Итог по партиям [игрок 1, игрок 2]; null — не сыгран или неявка */
  score: [number, number] | null;
  /** Техническая победа (W:L) */
  walkover: boolean;
  winner: string | null;
  loser: string | null;
  /** Номер матча в сетке */
  number?: number;
  /** Подписи источников в сетке, например «−6» (проигравший матча 6) */
  from?: [string | null, string | null];
  /** Матч перенесён из группы в финал по кругу («с зачётом») */
  carried?: boolean;
}

export type TournamentStatus = "upcoming" | "live" | "finished";

export interface StandingRow {
  playerId: string;
  played: number;
  won: number;
  lost: number;
  setsWon: number;
  setsLost: number;
  pointsWon: number;
  pointsLost: number;
  /** Очки в таблице: 2 за победу, 1 за поражение */
  score: number;
  place: number;
}

export interface GroupData {
  name: string;
  /** group — группа, final — финал по кругу, table — единая таблица круговой системы */
  kind: "group" | "final" | "table";
  /** Места в этом финале начинаются с placeOffset + 1 */
  placeOffset: number;
  playerIds: string[];
  matches: Match[];
  standings: StandingRow[];
  complete: boolean;
}

export interface BracketColumn {
  title: string;
  matches: Match[];
}

export interface BracketSection {
  title: string;
  columns: BracketColumn[];
}

export interface BracketData {
  title: string;
  kind: BracketKind;
  sections: BracketSection[];
}

export interface Placement {
  playerId: string;
  place: string;
}

export interface TournamentData {
  tournament: Tournament;
  /** Все матчи, которые нужно сыграть (без свободных проходов) */
  matches: Match[];
  groups: GroupData[];
  brackets: BracketData[];
  status: TournamentStatus;
  playedCount: number;
  placements: Placement[];
}
