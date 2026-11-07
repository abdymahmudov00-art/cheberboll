import type {
  BracketColumn,
  BracketData,
  BracketKind,
  BracketSection,
  GroupData,
  Match,
  MatchResult,
  Placement,
  StandingRow,
  Stage,
  Tournament,
  TournamentData,
} from "@/types";
import { resultScore, resultWinner } from "./scoring";
import { groupLetter } from "./labels";

/** Результаты матчей по id матча */
export type Results = Record<string, MatchResult>;

/** «Точно никого»: свободный проход в сетке */
const BYE = "__bye__";

/* ======================================================================
   Круговая система
   ====================================================================== */

/** Расписание по «методу круга»: список туров, в каждом — пары */
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
    // первый игрок на месте, остальные сдвигаются по кругу
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
  number?: number;
  from?: [string | null, string | null];
}

function makeMatch(
  base: MatchBase,
  p1: string | null,
  p2: string | null,
  results: Results,
  bestOf: number,
): Match {
  const raw = p1 && p2 ? (results[base.id] ?? null) : null;
  let result: MatchResult | null = null;
  let winner: string | null = null;
  let loser: string | null = null;
  if (p1 && p2 && raw) {
    const side = resultWinner(raw, bestOf);
    if (side) {
      result = raw;
      winner = side === 1 ? p1 : p2;
      loser = side === 1 ? p2 : p1;
    }
  }
  return {
    ...base,
    p1,
    p2,
    bye: false,
    result,
    sets: result?.type === "sets" ? result.sets : null,
    score: result ? resultScore(result) : null,
    walkover: result?.type === "walkover",
    winner,
    loser,
  };
}

/* ======================================================================
   Турнирная таблица
   ====================================================================== */

function share(won: number, lost: number): number {
  return won + lost === 0 ? 0 : won / (won + lost);
}

/**
 * Очки: 2 за победу, 1 за поражение, 0 за неявку.
 * При равенстве очков: личные встречи, затем соотношение партий и мячей.
 */
export function computeStandings(ids: string[], matches: Match[], headToHead = true): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  const noShows = new Map<string, number>();
  for (const id of ids) {
    rows.set(id, {
      playerId: id, played: 0, won: 0, lost: 0, setsWon: 0, setsLost: 0,
      pointsWon: 0, pointsLost: 0, score: 0, place: 0,
    });
  }

  for (const m of matches) {
    if (!m.winner || !m.loser) continue;
    const w = rows.get(m.winner);
    const l = rows.get(m.loser);
    if (!w || !l) continue;
    w.played++;
    l.played++;
    w.won++;
    l.lost++;
    if (m.walkover) {
      noShows.set(m.loser, (noShows.get(m.loser) ?? 0) + 1);
      continue;
    }
    if (m.score && m.p1 && m.p2) {
      const r1 = rows.get(m.p1);
      const r2 = rows.get(m.p2);
      if (r1 && r2) {
        r1.setsWon += m.score[0]; r1.setsLost += m.score[1];
        r2.setsWon += m.score[1]; r2.setsLost += m.score[0];
        for (const [a, b] of m.sets ?? []) {
          r1.pointsWon += a; r1.pointsLost += b;
          r2.pointsWon += b; r2.pointsLost += a;
        }
      }
    }
  }

  const list = [...rows.values()];
  for (const r of list) r.score = r.won * 2 + (r.lost - (noShows.get(r.playerId) ?? 0));
  list.sort((a, b) => b.score - a.score);

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

/* ======================================================================
   Сетки на выбывание: шаблон (кто с кем) + расчёт по результатам
   ====================================================================== */

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
  if (matchesInRound === 2) return "1/2";
  return `1/${matchesInRound}`;
}

/** Откуда приходит участник матча: слот посева, победитель или проигравший другого матча */
type Src = { t: "seed"; i: number } | { t: "w"; n: number } | { t: "l"; n: number };

interface BracketNode {
  a: Src;
  b: Src;
  section: string;
  column: string;
  /** Места [с, по] для победителя / проигравшего этого матча */
  winnerPlace?: [number, number];
  loserPlace?: [number, number];
}

const range = (lo: number, hi: number) => (lo === hi ? `${lo}` : `${lo}..${hi}`);
const W = (n: number): Src => ({ t: "w", n });
const L = (n: number): Src => ({ t: "l", n });

/** Один круг: пары по порядку, возвращает id созданных матчей */
function addRound(nodes: BracketNode[], entrants: Src[], section: string, column: string): number[] {
  const ids: number[] = [];
  for (let i = 0; i < entrants.length; i += 2) {
    nodes.push({ a: entrants[i], b: entrants[i + 1], section, column });
    ids.push(nodes.length - 1);
  }
  return ids;
}

/**
 * Розыгрыш всех мест (как «приложение 11»): в каждом круге победители играют за верхние места,
 * проигравшие — за нижние. Матчи создаются по кругам, чтобы номера шли по порядку игры.
 */
function allPlaces(nodes: BracketNode[], entrants: Src[], from: number, mainSection?: string) {
  type Task = { entrants: Src[]; from: number; section: string; main: boolean };
  let level: Task[] = [
    { entrants, from, section: mainSection ?? `Места ${range(from, from + entrants.length - 1)}`, main: Boolean(mainSection) },
  ];
  while (level.length) {
    const next: Task[] = [];
    for (const task of level) {
      const n = task.entrants.length;
      if (n < 2) continue;
      const column = task.main ? roundTitle(n / 2) : range(task.from, task.from + n - 1);
      const ids = addRound(nodes, task.entrants, task.section, column);
      if (n === 2) {
        nodes[ids[0]].winnerPlace = [task.from, task.from];
        nodes[ids[0]].loserPlace = [task.from + 1, task.from + 1];
        continue;
      }
      next.push({ entrants: ids.map(W), from: task.from, section: task.section, main: task.main });
      const lf = task.from + n / 2;
      next.push({ entrants: ids.map(L), from: lf, section: `Места ${range(lf, task.from + n - 1)}`, main: false });
    }
    level = next;
  }
}

function buildTemplate(kind: BracketKind, size: number, base: number): BracketNode[] {
  const nodes: BracketNode[] = [];
  const seeds: Src[] = Array.from({ length: size }, (_, i) => ({ t: "seed", i }));

  if (kind === "p11") {
    allPlaces(nodes, seeds, base + 1, "Основная сетка");
    return nodes;
  }

  // Основная сетка (общая для single и p12)
  const wRounds: number[][] = [];
  let entrants = seeds;
  while (entrants.length > 1) {
    const ids = addRound(nodes, entrants, "Основная сетка", roundTitle(entrants.length / 2));
    wRounds.push(ids);
    entrants = ids.map(W);
  }
  const final = wRounds[wRounds.length - 1][0];
  nodes[final].winnerPlace = [base + 1, base + 1];
  nodes[final].loserPlace = [base + 2, base + 2];

  if (kind === "single") {
    // места не разыгрываются: выбывшие делят места своего круга
    for (let r = 0; r < wRounds.length - 1; r++) {
      const m = wRounds[r].length;
      for (const id of wRounds[r]) nodes[id].loserPlace = [base + m + 1, base + 2 * m];
    }
    return nodes;
  }

  // p12: нижняя сетка, проигравшие в основной получают второй шанс на 3 место
  const k = wRounds.length;
  if (k < 2) return nodes;
  const futureDrops = (r: number) => wRounds.slice(r + 1, k - 1).reduce((s, x) => s + x.length, 0);
  const lbRounds: number[][] = [];

  const firstLosers = wRounds[0].map(L);
  let lb = addRound(nodes, firstLosers, "Нижняя сетка", range(base + 3, base + 2 + firstLosers.length + futureDrops(0)));
  lbRounds.push(lb);

  for (let r = 1; r <= k - 2; r++) {
    const dropped = wRounds[r];
    const m = dropped.length;
    const pairs: Src[] = [];
    // проигравшие основной сетки встают в обратном порядке, чтобы избежать повторных встреч
    for (let i = 0; i < m; i++) pairs.push(W(lb[i]), L(dropped[m - 1 - i]));
    lb = addRound(nodes, pairs, "Нижняя сетка", range(base + 3, base + 2 + 2 * m + futureDrops(r)));
    lbRounds.push(lb);
    if (m > 1) {
      lb = addRound(nodes, lb.map(W), "Нижняя сетка", range(base + 3, base + 2 + m + futureDrops(r)));
      lbRounds.push(lb);
    }
  }

  const third = lbRounds[lbRounds.length - 1][0];
  nodes[third].winnerPlace = [base + 3, base + 3];
  nodes[third].loserPlace = [base + 4, base + 4];

  // Выбывшие из нижней сетки разыгрывают оставшиеся места: сначала считаем диапазоны, потом создаём матчи
  const ranges: { round: number[]; from: number }[] = [];
  let cursor = base + 5;
  for (let r = lbRounds.length - 2; r >= 0; r--) {
    ranges.push({ round: lbRounds[r], from: cursor });
    cursor += lbRounds[r].length;
  }
  for (const { round, from } of ranges.reverse()) {
    if (round.length === 1) nodes[round[0]].loserPlace = [from, from];
    else allPlaces(nodes, round.map(L), from);
  }
  return nodes;
}

interface BracketResult {
  data: BracketData;
  matches: Match[];
  placements: Placement[];
}

/**
 * Строит сетку по посеву и результатам.
 * seeded — игроки в порядке посева; null — участник ещё не определён (например, группы не доиграны).
 */
function buildBracket(
  t: Tournament,
  kind: BracketKind,
  seeded: (string | null)[],
  results: Results,
  prefix: string,
  title: string,
  placeFrom = 1,
): BracketResult {
  let size = 2;
  while (size < seeded.length) size *= 2;
  const slots = seedOrder(size).map((s) => (s <= seeded.length ? (seeded[s - 1] ?? null) : BYE));
  const nodes = buildTemplate(kind, size, placeFrom - 1);

  const winners: (string | null)[] = [];
  const losers: (string | null)[] = [];
  const matches: Match[] = [];
  const placements: Placement[] = [];

  const resolve = (src: Src): string | null =>
    src.t === "seed" ? slots[src.i] : src.t === "w" ? winners[src.n] : losers[src.n];
  const fromLabel = (src: Src): string | null => (src.t === "l" ? `−${src.n + 1}` : null);
  const place = (p: [number, number]) => (p[0] === p[1] ? `${p[0]}` : `${p[0]}–${p[1]}`);

  nodes.forEach((node, i) => {
    const a = resolve(node.a);
    const b = resolve(node.b);
    const base: MatchBase = {
      id: `${t.id}-${prefix}-${i}`,
      tournamentId: t.id,
      stage: "playoff",
      round: 0,
      index: i,
      label: `${title === "Сетка" ? "" : `${title}, `}${node.column}`,
      number: i + 1,
      from: [fromLabel(node.a), fromLabel(node.b)],
    };

    let m: Match;
    if (a === BYE || b === BYE) {
      const other = a === BYE ? b : a;
      m = {
        ...base,
        p1: a === BYE ? null : a,
        p2: b === BYE ? null : b,
        bye: true,
        result: null,
        sets: null,
        score: null,
        walkover: false,
        winner: other,
        loser: other === null ? null : BYE,
      };
      winners[i] = other;
      losers[i] = other === null ? null : BYE;
    } else {
      m = makeMatch(base, a, b, results, t.bestOf);
      winners[i] = m.winner;
      losers[i] = m.loser;
    }
    matches.push(m);

    if (node.winnerPlace && winners[i] && winners[i] !== BYE) {
      placements.push({ playerId: winners[i] as string, place: place(node.winnerPlace) });
    }
    if (node.loserPlace && losers[i] && losers[i] !== BYE) {
      placements.push({ playerId: losers[i] as string, place: place(node.loserPlace) });
    }
  });

  // группируем матчи в разделы и столбцы для отображения
  const sections: BracketSection[] = [];
  nodes.forEach((node, i) => {
    let section = sections.find((s) => s.title === node.section);
    if (!section) {
      section = { title: node.section, columns: [] };
      sections.push(section);
    }
    let column: BracketColumn | undefined = section.columns.find((c) => c.title === node.column);
    if (!column) {
      column = { title: node.column, matches: [] };
      section.columns.push(column);
    }
    column.matches.push(matches[i]);
  });

  placements.sort((x, y) => parseInt(x.place) - parseInt(y.place));
  return { data: { title, kind, sections }, matches, placements };
}

/* ======================================================================
   Группы
   ====================================================================== */

/**
 * Посев «змейкой»: 1→A, 2→B, 3→B, 4→A, ...
 * Если поровну не делится, лишние игроки уходят в последние группы (4, 4, 4, 5).
 */
export function snakeGroups(ids: string[], groupCount: number): string[][] {
  const groups: string[][] = Array.from({ length: groupCount }, () => []);
  const fullRows = Math.floor(ids.length / groupCount);
  ids.forEach((id, i) => {
    const row = Math.floor(i / groupCount);
    const pos = i % groupCount;
    if (row < fullRows) {
      groups[row % 2 === 0 ? pos : groupCount - 1 - pos].push(id);
      return;
    }
    // неполный последний ряд: только последние группы, направление «змейки» сохраняем
    const rest = ids.length % groupCount;
    const first = groupCount - rest;
    groups[row % 2 === 0 ? first + pos : groupCount - 1 - pos].push(id);
  });
  return groups;
}

function roundRobinMatches(
  t: Tournament,
  ids: string[],
  results: Results,
  stage: Stage,
  group?: number,
  cycles = 1,
): Match[] {
  const prefix = group === undefined ? `${t.id}-rr` : `${t.id}-g${group}`;
  const rounds = roundRobinRounds(ids);
  const out: Match[] = [];
  for (let c = 0; c < cycles; c++) {
    rounds.forEach((pairs, r) => {
      pairs.forEach(([a, b], i) => {
        const [p1, p2] = c === 1 ? [b, a] : [a, b];
        const tour = c === 0 ? `Тур ${r + 1}` : `Круг 2, тур ${r + 1}`;
        out.push(
          makeMatch(
            {
              id: c === 0 ? `${prefix}-${r}-${i}` : `${prefix}-c2-${r}-${i}`,
              tournamentId: t.id,
              stage,
              group,
              round: c * rounds.length + r,
              index: i,
              label: group === undefined ? tour : `Группа ${groupLetter(group)}, ${tour.toLowerCase()}`,
            },
            p1,
            p2,
            results,
            t.bestOf,
          ),
        );
      });
    });
  }
  return out;
}

/** Порядок выхода из групп: все первые места, потом все вторые… (A1, B1, A2, B2) */
function qualifiers(groups: GroupData[], fromPlace: number, toPlace: number): string[] {
  const out: string[] = [];
  for (let p = fromPlace; p < toPlace; p++) {
    for (const g of groups) {
      const id = g.standings[p]?.playerId;
      if (id) out.push(id);
    }
  }
  return out;
}

/* ======================================================================
   Сборка турнира целиком
   ====================================================================== */

export function buildTournament(t: Tournament, results: Results): TournamentData {
  let groups: GroupData[] = [];
  const brackets: BracketResult[] = [];
  let placements: Placement[] = [];
  const kind: BracketKind = t.bracketKind ?? "p12";

  const tableOf = (name: string, ids: string[], matches: Match[], k: GroupData["kind"], offset = 0): GroupData => ({
    name,
    kind: k,
    placeOffset: offset,
    playerIds: ids,
    matches,
    standings: computeStandings(ids, matches),
    complete: matches.length > 0 && matches.every((m) => m.winner),
  });

  if (t.format === "round-robin" || t.format === "round-robin-2") {
    const matches = roundRobinMatches(t, t.playerIds, results, "rr", undefined, t.format === "round-robin-2" ? 2 : 1);
    const table = tableOf("Турнирная таблица", t.playerIds, matches, "table");
    groups = [table];
    if (table.complete) placements = table.standings.map((r) => ({ playerId: r.playerId, place: String(r.place) }));
  } else if (t.format === "single-elim" || t.format === "bracket-11" || t.format === "bracket-12") {
    const k: BracketKind = t.format === "single-elim" ? "single" : t.format === "bracket-11" ? "p11" : "p12";
    const b = buildBracket(t, k, t.playerIds, results, "po", "Сетка");
    brackets.push(b);
    placements = b.placements;
  } else {
    const groupCount = t.groupCount ?? 2;
    const advance = t.advancePerGroup ?? 2;
    groups = snakeGroups(t.playerIds, groupCount).map((ids, g) =>
      tableOf(`Группа ${groupLetter(g)}`, ids, roundRobinMatches(t, ids, results, "group", g), "group"),
    );
    const done = groups.every((g) => g.complete);
    const maxSize = Math.max(...groups.map((g) => g.playerIds.length));
    const firstCount = groups.reduce((s, g) => s + Math.min(advance, g.playerIds.length), 0);
    const restCount = t.playerIds.length - firstCount;
    const pick = (from: number, to: number, count: number) =>
      done ? qualifiers(groups, from, to) : Array.from({ length: count }, () => null);

    if (t.format === "groups-playoff") {
      const b = buildBracket(t, kind, pick(0, advance, firstCount), results, "po", "Сетка");
      brackets.push(b);
      placements = b.placements;
    } else if (t.format === "groups-two-finals") {
      const f1 = buildBracket(t, kind, pick(0, advance, firstCount), results, "f1", "Финал 1");
      brackets.push(f1);
      if (restCount > 1) {
        const f2 = buildBracket(t, kind, pick(advance, maxSize, restCount), results, "f2", "Финал 2", firstCount + 1);
        brackets.push(f2);
      }
      placements = brackets.flatMap((b) => b.placements);
    } else if (done) {
      // финалы по кругу «с зачётом»: встречи из одной группы переносятся, остальные играются заново
      const groupMatches = groups.flatMap((g) => g.matches);
      const groupOf = new Map<string, number>();
      groups.forEach((g, gi) => g.playerIds.forEach((id) => groupOf.set(id, gi)));
      const finals = [qualifiers(groups, 0, advance), qualifiers(groups, advance, maxSize)].filter((f) => f.length > 1);
      let offset = 0;
      finals.forEach((ids, fi) => {
        const matches: Match[] = [];
        roundRobinRounds(ids).forEach((pairs, r) => {
          pairs.forEach(([a, b], i) => {
            if (groupOf.get(a) === groupOf.get(b)) {
              const carried = groupMatches.find((m) => (m.p1 === a && m.p2 === b) || (m.p1 === b && m.p2 === a));
              if (carried) matches.push({ ...carried, carried: true });
              return;
            }
            matches.push(
              makeMatch(
                { id: `${t.id}-f${fi}-${r}-${i}`, tournamentId: t.id, stage: "rr", round: r, index: i, label: `Финал ${fi + 1}, тур ${r + 1}` },
                a, b, results, t.bestOf,
              ),
            );
          });
        });
        groups.push(tableOf(`Финал ${fi + 1}`, ids, matches, "final", offset));
        offset += ids.length;
      });
      const finalTables = groups.filter((g) => g.kind === "final");
      if (finalTables.every((g) => g.complete)) {
        placements = finalTables.flatMap((g) =>
          g.standings.map((r) => ({ playerId: r.playerId, place: String(g.placeOffset + r.place) })),
        );
      }
    }
  }

  // все матчи без дублей (перенесённые в финал встречи считаются один раз) и без свободных проходов
  const seen = new Set<string>();
  const matches: Match[] = [];
  for (const m of [...groups.flatMap((g) => g.matches), ...brackets.flatMap((b) => b.matches)]) {
    if (m.bye || seen.has(m.id)) continue;
    seen.add(m.id);
    matches.push(m);
  }
  const playedCount = matches.filter((m) => m.winner).length;
  const waitingFinals = t.format === "groups-rr-finals" && !groups.some((g) => g.kind === "final");
  const finished = matches.length > 0 && playedCount === matches.length && !waitingFinals;

  return {
    tournament: t,
    matches,
    groups,
    brackets: brackets.map((b) => b.data),
    status: finished ? "finished" : playedCount > 0 ? "live" : "upcoming",
    playedCount,
    placements,
  };
}
