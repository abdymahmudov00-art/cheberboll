export type Format = "round-robin" | "single-elim" | "groups-playoff";

/** Счёт одной партии: [очки первого игрока, очки второго игрока] */
export type SetScore = [number, number];

export interface Player {
  id: string;
  name: string;
  city: string;
  /** Рейтинг до первого турнира в системе */
  startRating: number;
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
  /** Только для формата «группы + плей-офф» */
  groupCount?: number;
  advancePerGroup?: number;
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
  sets: SetScore[] | null;
  winner: string | null;
  loser: string | null;
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
  playerIds: string[];
  matches: Match[];
  standings: StandingRow[];
  complete: boolean;
}

export interface BracketRound {
  title: string;
  matches: Match[];
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
  bracket: BracketRound[] | null;
  status: TournamentStatus;
  playedCount: number;
  placements: Placement[];
}
