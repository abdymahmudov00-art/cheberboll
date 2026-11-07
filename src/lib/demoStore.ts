import type { SetScore, Tournament } from "@/types";
import type { Scores } from "./tournament";

/**
 * Хранилище демо-версии: созданные турниры и введённые результаты.
 * Живёт в браузере (localStorage). Когда появится backend, его заменят запросы к API.
 */

export interface DemoState {
  version: 1;
  createdTournaments: Tournament[];
  /** Результаты, введённые пользователем, поверх тестовых. null — результат удалён. */
  scores: Record<string, SetScore[] | null>;
}

const KEY = "cheber-boll-demo-v1";
const EMPTY: DemoState = { version: 1, createdTournaments: [], scores: {} };

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
    if (parsed?.version === 1) state = parsed;
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
  setScore(matchId: string, sets: SetScore[] | null) {
    update({ ...state, scores: { ...state.scores, [matchId]: sets } });
  },
  addTournament(t: Tournament) {
    update({ ...state, createdTournaments: [...state.createdTournaments, t] });
  },
  reset() {
    update(EMPTY);
  },
};

/** Тестовые результаты + изменения пользователя */
export function mergeScores(seed: Scores, overrides: DemoState["scores"]): Scores {
  const result: Scores = { ...seed };
  for (const [id, sets] of Object.entries(overrides)) {
    if (sets) result[id] = sets;
    else delete result[id];
  }
  return result;
}
