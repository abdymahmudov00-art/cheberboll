import type { Match, Player, SetScore, Tournament } from "@/types";
import { buildTournament, type Scores } from "./tournament";
import { hashString, mulberry32 } from "./random";
import { setsToWin } from "./scoring";

/** Правдоподобный счёт матча: сильнейший по рейтингу выигрывает чаще */
function simulateMatch(m: Match, rating: Record<string, number>, bestOf: number): SetScore[] {
  const rnd = mulberry32(hashString(m.id));
  const r1 = rating[m.p1 ?? ""] ?? 500;
  const r2 = rating[m.p2 ?? ""] ?? 500;
  const pSet = 1 / (1 + 10 ** ((r2 - r1) / 250));
  const need = setsToWin(bestOf);
  const sets: SetScore[] = [];
  let a = 0;
  let b = 0;
  while (a < need && b < need) {
    const firstWins = rnd() < pSet;
    let win = 11;
    let lose = 3 + Math.floor(rnd() * 7);
    if (rnd() < 0.15) {
      lose = 10 + Math.floor(rnd() * 3);
      win = lose + 2;
    }
    sets.push(firstWins ? [win, lose] : [lose, win]);
    if (firstWins) a++;
    else b++;
  }
  return sets;
}

/** Заполняет тестовые турниры результатами. Детерминированно: одинаково на сервере и в браузере. */
export function generateSeedScores(
  players: Player[],
  tournaments: Tournament[],
  autoplay: Record<string, number | "all">,
): Scores {
  const rating: Record<string, number> = {};
  for (const p of players) rating[p.id] = p.startRating;
  const scores: Scores = {};

  for (const t of tournaments) {
    const limit = autoplay[t.id];
    if (!limit) continue;
    let played = 0;
    // Играем по одному матчу: новые матчи сетки появляются по мере появления победителей
    for (let guard = 0; guard < 500; guard++) {
      if (limit !== "all" && played >= limit) break;
      const next = buildTournament(t, scores).matches.find((m) => m.p1 && m.p2 && !m.winner);
      if (!next) break;
      scores[next.id] = simulateMatch(next, rating, t.bestOf);
      played++;
    }
  }
  return scores;
}
