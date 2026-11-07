import type {
  BracketRound,
  GroupData,
  Match,
  Placement,
  SetScore,
  StandingRow,
  Stage,
  Tournament,
  TournamentData,
} from "@/types";
import { countSets, winnerSide } from "./scoring";
import { groupLetter } from "./labels";

export type Scores = Record<string, SetScore[]>;

const BYE = "__bye__";

/* ---------- Круговая система: расписание по «методу круга» ---------- */

export function roundRobinRounds(ids: string[]): [string, string][][] {
  const list = ids.length % 2 === 1 ? [...ids, BYE] : [...ids];
  const n = list.length;
  const rounds: [string, string][][] = [];
  const arr = [...list];
  for (let r = 0; r < n - 1; r++) {
    const pairs: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a !== BYE && b !== BYE) pairs.push(r % 2 === 1 ? [b, a] : [a, b]);
    }
    rounds.push(pairs);
    // фиксируем первого игрока, остальных сдвигаем по кругу
    const last = arr.pop();
    if (last !== undefined) arr.splice(1, 0, last);
  }
  return rounds;
}

interface MatchBase {
  id: string;
  tournamentId: string;
  stage: Stage;
  group?: number;
  round: number;
  index: number;
  label: string;
}

function makeMatch(
  base: MatchBase,
  p1: string | null,
  p2: string | null,
  scores: Scores,
  bestOf: number,
): Match {
  const raw = p1 && p2 ? (scores[base.id] ?? null) : null;
  let winner: string | null = null;
  let loser: string | null = null;
  if (p1 && p2 && raw) {
    const side = winnerSide(raw, bestOf);
    if (side === 1) {
      winner = p1;
      loser = p2;
    } else if (side === 2) {
      winner = p2;
      loser = p1;
    }
  }
  return { ...base, p1, p2, bye: false, sets: winner ? raw : null, winner, loser };
}

/* ---------- Турнирная таблица ---------- */

function share(won: number, lost: number): number {
  return won + lost === 0 ? 0 : won / (won + lost);
}

export function computeStandings(
  ids: string[],
  matches: Match[],
  headToHead = true,
): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  for (const id of ids) {
    rows.set(id, {
      playerId: id, played: 0, won: 0, lost: 0, setsWon: 0, setsLost: 0,
      pointsWon: 0, pointsLost: 0, score: 0, place: 0,
    });
  }

  for (const m of matches) {
    if (!m.winner || !m.sets || !m.p1 || !m.p2) continue;
    const r1 = rows.get(m.p1);
    const r2 = rows.get(m.p2);
    if (!r1 || !r2) continue;
    const [s1, s2] = countSets(m.sets);
    let pt1 = 0;
    let pt2 = 0;
    for (const [a, b] of m.sets) {
      pt1 += a;
      pt2 += b;
    }
    r1.played++; r2.played++;
    r1.setsWon += s1; r1.setsLost += s2;
    r2.setsWon += s2; r2.setsLost += s1;
    r1.pointsWon += pt1; r1.pointsLost += pt2;
    r2.pointsWon += pt2; r2.pointsLost += pt1;
    if (m.winner === m.p1) { r1.won++; r2.lost++; } else { r2.won++; r1.lost++; }
  }

  const list = [...rows.values()];
  for (const r of list) r.score = r.won * 2 + r.lost;
  list.sort((a, b) => b.score - a.score);

  // При равенстве очков: личные встречи между равными, затем соотношение партий и мячей
  const result: StandingRow[] = [];
  let i = 0;
  while (i < list.length) {
    let j = i;
    while (j < list.length && list[j].score === list[i].score) j++;
    const tied = list.slice(i, j);
    if (tied.length > 1) {
      const tiedIds = new Set(tied.map((r) => r.playerId));
      const mini = headToHead
        ? computeStandings(
            [...tiedIds],
            matches.filter((m) => m.p1 && m.p2 && tiedIds.has(m.p1) && tiedIds.has(m.p2)),
            false,
          )
        : [];
      const miniById = new Map(mini.map((r) => [r.playerId, r]));
      tied.sort((a, b) => {
        const ma = miniById.get(a.playerId);
        const mb = miniById.get(b.playerId);
        if (ma && mb) {
          if (mb.score !== ma.score) return mb.score - ma.score;
          const ds = share(mb.setsWon, mb.setsLost) - share(ma.setsWon, ma.setsLost);
          if (ds !== 0) return ds;
        }
        const s = share(b.setsWon, b.setsLost) - share(a.setsWon, a.setsLost);
        if (s !== 0) return s;
        return share(b.pointsWon, b.pointsLost) - share(a.pointsWon, a.pointsLost);
      });
    }
    result.push(...tied);
    i = j;
  }
  result.forEach((r, idx) => { r.place = idx + 1; });
  return result;
}

/* ---------- Сетка на выбывание ---------- */

/** Стандартный порядок посева: 1 и 2 номера могут встретиться только в финале */
export function seedOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const n = order.length * 2;
    order = order.flatMap((s) => [s, n + 1 - s]);
  }
  return order;
}

export function roundTitle(matchesInRound: number): string {
  if (matchesInRound === 1) return "Финал";
  if (matchesInRound === 2) return "Полуфинал";
  return `1/${matchesInRound} финала`;
}

function buildBracket(t: Tournament, seeded: (string | null)[], scores: Scores): BracketRound[] {
  const count = seeded.length;
  let size = 2;
  while (size < count) size *= 2;
  const order = seedOrder(size);
  let entrants: (string | null)[] = order.map((s) => (s <= count ? (seeded[s - 1] ?? null) : BYE));

  const rounds: BracketRound[] = [];
  let r = 0;
  while (entrants.length > 1) {
    const total = entrants.length / 2;
    const title = roundTitle(total);
    const matches: Match[] = [];
    const next: (string | null)[] = [];
    for (let i = 0; i < total; i++) {
      const a = entrants[2 * i];
      const b = entrants[2 * i + 1];
      const base: MatchBase = {
        id: `${t.id}-po-${r}-${i}`,
        tournamentId: t.id,
        stage: "playoff",
        round: r,
        index: i,
        label: title,
      };
      if (a === BYE || b === BYE) {
        const adv = a === BYE ? b : a;
        matches.push({
          ...base,
          p1: a === BYE ? null : a,
          p2: b === BYE ? null : b,
          bye: true,
          sets: null,
          winner: adv === BYE ? null : adv,
          loser: null,
        });
        next.push(adv);
        continue;
      }
      const m = makeMatch(base, a, b, scores, t.bestOf);
      matches.push(m);
      next.push(m.winner);
    }
    rounds.push({ title, matches });
    entrants = next;
    r++;
  }
  return rounds;
}

function bracketPlacements(bracket: BracketRound[]): Placement[] {
  const final = bracket[bracket.length - 1]?.matches[0];
  if (!final?.winner || !final.loser) return [];
  const result: Placement[] = [
    { playerId: final.winner, place: "1" },
    { playerId: final.loser, place: "2" },
  ];
  for (let r = bracket.length - 2; r >= 0; r--) {
    const n = bracket[r].matches.length;
    for (const m of bracket[r].matches) {
      if (m.loser) result.push({ playerId: m.loser, place: `${n + 1}–${2 * n}` });
    }
  }
  return result;
}

/* ---------- Группы ---------- */

/** Посев «змейкой»: 1→A, 2→B, 3→B, 4→A, ... */
export function snakeGroups(ids: string[], groupCount: number): string[][] {
  const groups: string[][] = Array.from({ length: groupCount }, () => []);
  ids.forEach((id, i) => {
    const row = Math.floor(i / groupCount);
    const col = row % 2 === 0 ? i % groupCount : groupCount - 1 - (i % groupCount);
    groups[col].push(id);
  });
  return groups;
}

function roundRobinMatches(
  t: Tournament,
  ids: string[],
  scores: Scores,
  stage: Stage,
  group?: number,
): Match[] {
  const prefix = group === undefined ? `${t.id}-rr` : `${t.id}-g${group}`;
  return roundRobinRounds(ids).flatMap((pairs, r) =>
    pairs.map(([a, b], i) =>
      makeMatch(
        {
          id: `${prefix}-${r}-${i}`,
          tournamentId: t.id,
          stage,
          group,
          round: r,
          index: i,
          label: group === undefined ? `Тур ${r + 1}` : `Группа ${groupLetter(group)}, тур ${r + 1}`,
        },
        a,
        b,
        scores,
        t.bestOf,
      ),
    ),
  );
}

/* ---------- Сборка турнира целиком ---------- */

export function buildTournament(t: Tournament, scores: Scores): TournamentData {
  let groups: GroupData[] = [];
  let bracket: BracketRound[] | null = null;
  let finished = false;
  let placements: Placement[] = [];

  if (t.format === "round-robin") {
    const matches = roundRobinMatches(t, t.playerIds, scores, "rr");
    const standings = computeStandings(t.playerIds, matches);
    const complete = matches.length > 0 && matches.every((m) => m.winner);
    groups = [{ name: "Турнирная таблица", playerIds: t.playerIds, matches, standings, complete }];
    finished = complete;
    if (complete) placements = standings.map((r) => ({ playerId: r.playerId, place: String(r.place) }));
  } else if (t.format === "single-elim") {
    bracket = buildBracket(t, t.playerIds, scores);
    placements = bracketPlacements(bracket);
    finished = placements.length > 0;
  } else {
    const groupCount = t.groupCount ?? 2;
    const advance = t.advancePerGroup ?? 2;
    groups = snakeGroups(t.playerIds, groupCount).map((ids, g) => {
      const matches = roundRobinMatches(t, ids, scores, "group", g);
      return {
        name: `Группа ${groupLetter(g)}`,
        playerIds: ids,
        matches,
        standings: computeStandings(ids, matches),
        complete: matches.length > 0 && matches.every((m) => m.winner),
      };
    });
    const allGroupsDone = groups.every((g) => g.complete);
    const seeded: (string | null)[] = [];
    for (let p = 0; p < advance; p++) {
      for (const g of groups) {
        seeded.push(allGroupsDone ? (g.standings[p]?.playerId ?? null) : null);
      }
    }
    bracket = buildBracket(t, seeded, scores);
    placements = bracketPlacements(bracket);
    finished = placements.length > 0;
  }

  const groupMatches = groups.flatMap((g) => g.matches);
  const playoffMatches = bracket ? bracket.flatMap((r) => r.matches).filter((m) => !m.bye) : [];
  const matches = [...groupMatches, ...playoffMatches];
  const playedCount = matches.filter((m) => m.winner).length;

  return {
    tournament: t,
    matches,
    groups,
    bracket,
    status: finished ? "finished" : playedCount > 0 ? "live" : "upcoming",
    playedCount,
    placements,
  };
}
