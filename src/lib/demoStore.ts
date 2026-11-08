import type { MatchResult, Player, Tournament } from "@/types";
import type { Results } from "./tournament";

/**
 * Хранилище демо-версии: созданные турниры и игроки, введённые результаты, матчи за столами.
 * Живёт в браузере (localStorage). Когда появится backend, его заменят запросы к API.
 */

export interface LiveMatch {
  table: number;
  /** Время вызова к столу, мс */
  startedAt: number;
}

export interface DemoState {
  version: 3;
  createdTournaments: Tournament[];
  createdPlayers: Player[];
  /** Результаты, введённые пользователем, поверх тестовых. null — результат удалён. */
  results: Record<string, MatchResult | null>;
  /** Матчи, которые сейчас играются: id матча → стол */
  live: Record<string, LiveMatch>;
  /** Завершённые турниры, открытые организатором для правок */
  unlocked?: Record<string, boolean>;
}

// Номер версии меняется, когда старые сохранённые данные больше не подходят (сброс у всех)
const KEY = "cheber-boll-demo-v3";
const EMPTY: DemoState = { version: 3, createdTournaments: [], createdPlayers: [], results: {}, live: {} };

let state: DemoState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as DemoState;
    if (parsed?.version === 3) state = { ...EMPTY, ...parsed };
  } catch {
    // повреждённые данные или запрет доступа: работаем с пустым состоянием
  }
}

function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // хранилище недоступно: изменения живут до перезагрузки страницы
  }
}

function update(next: DemoState) {
  state = next;
  save();
  listeners.forEach((l) => l());
}

function withoutLive(id: string): Record<string, LiveMatch> {
  const live = { ...state.live };
  delete live[id];
  return live;
}

export const demoStore = {
  subscribe(listener: () => void) {
    load();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): DemoState {
    load();
    return state;
  },
  getServerSnapshot(): DemoState {
    return EMPTY;
  },
  /** Записать или удалить результат. Матч при этом освобождает стол. */
  setResult(matchId: string, result: MatchResult | null) {
    update({ ...state, results: { ...state.results, [matchId]: result }, live: withoutLive(matchId) });
  },
  /** Вызвать пару к столу */
  startMatch(matchId: string, table: number) {
    update({ ...state, live: { ...state.live, [matchId]: { table, startedAt: Date.now() } } });
  },
  /** Отменить игру: матч возвращается в ожидание */
  cancelMatch(matchId: string) {
    update({ ...state, live: withoutLive(matchId) });
  },
  /** Открыть завершённый турнир для правок или снова закрыть */
  setUnlocked(tournamentId: string, value: boolean) {
    const unlocked = { ...(state.unlocked ?? {}) };
    if (value) unlocked[tournamentId] = true;
    else delete unlocked[tournamentId];
    update({ ...state, unlocked });
  },
  addTournament(t: Tournament) {
    update({ ...state, createdTournaments: [...state.createdTournaments, t] });
  },
  addPlayer(p: Player) {
    update({ ...state, createdPlayers: [...state.createdPlayers, p] });
  },
  reset() {
    update(EMPTY);
  },
};

/** Тестовые результаты + изменения пользователя */
export function mergeResults(seed: Results, overrides: DemoState["results"]): Results {
  const result: Results = { ...seed };
  for (const [id, r] of Object.entries(overrides)) {
    if (r) result[id] = r;
    else delete result[id];
  }
  return result;
}
