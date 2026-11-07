import type { Match, Player, Tournament, TournamentData } from "@/types";

/** Коэффициент изменения рейтинга за матч (система Эло) */
const K = 24;
/** Масштаб: при разнице в 400 очков сильнейший выигрывает ~91% матчей */
const SCALE = 400;

export interface RatingPoint {
  date: string;
  rating: number;
  matchId: string | null;
}

export interface PlayedMatch {
  match: Match;
  tournament: Tournament;
  /** Изменение рейтинга [первого игрока, второго игрока] */
  delta: [number, number];
  /** Рейтинги перед матчем */
  before: [number, number];
}

export interface RatingResult {
  ratings: Record<string, number>;
  history: Record<string, RatingPoint[]>;
  /** Все сыгранные матчи в хронологическом порядке */
  played: PlayedMatch[];
}

export function expectedScore(ra: number, rb: number): number {
  return 1 / (1 + 10 ** ((rb - ra) / SCALE));
}

export function computeRatings(
  players: Player[],
  tournaments: Tournament[],
  data: Record<string, TournamentData>,
): RatingResult {
  const ratings: Record<string, number> = {};
  const history: Record<string, RatingPoint[]> = {};
  const played: PlayedMatch[] = [];

  const sorted = [...tournaments].sort((a, b) =>
    a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date),
  );
  const firstDate = sorted[0]?.date ?? "";

  for (const p of players) {
    ratings[p.id] = p.startRating;
    history[p.id] = [{ date: firstDate, rating: p.startRating, matchId: null }];
  }

  for (const t of sorted) {
    const d = data[t.id];
    if (!d) continue;
    for (const m of d.matches) {
      if (!m.winner || !m.p1 || !m.p2) continue;
      const r1 = ratings[m.p1];
      const r2 = ratings[m.p2];
      if (r1 === undefined || r2 === undefined) continue;
      // неявка (W:L) попадает в историю, но рейтинг не меняет
      if (m.walkover) {
        played.push({ match: m, tournament: t, delta: [0, 0], before: [r1, r2] });
        continue;
      }
      const s1 = m.winner === m.p1 ? 1 : 0;
      const d1 = Math.round(K * (s1 - expectedScore(r1, r2)));
      ratings[m.p1] = r1 + d1;
      ratings[m.p2] = r2 - d1;
      history[m.p1].push({ date: t.date, rating: ratings[m.p1], matchId: m.id });
      history[m.p2].push({ date: t.date, rating: ratings[m.p2], matchId: m.id });
      played.push({ match: m, tournament: t, delta: [d1, -d1], before: [r1, r2] });
    }
  }

  return { ratings, history, played };
}
