import type { SetScore } from "@/types";

/** Проверка одной партии по правилам настольного тенниса. Возвращает текст ошибки или null. */
export function setError(a: number, b: number): string | null {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
    return "введите целые неотрицательные числа";
  }
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  if (hi < 11) return "партия идёт до 11 очков";
  if (hi - lo < 2) return "нужен перевес минимум в 2 очка";
  if (hi > 11 && hi - lo !== 2) return "после 10:10 партия заканчивается при перевесе в 2 очка";
  return null;
}

export function setsToWin(bestOf: number): number {
  return Math.ceil(bestOf / 2);
}

export function countSets(sets: SetScore[]): [number, number] {
  let a = 0;
  let b = 0;
  for (const [x, y] of sets) {
    if (x > y) a++;
    else if (y > x) b++;
  }
  return [a, b];
}

/** Проверка всего матча. Возвращает текст ошибки или null. */
export function matchResultError(sets: SetScore[], bestOf: number): string | null {
  if (sets.length === 0) return "Добавьте хотя бы одну партию";
  for (let i = 0; i < sets.length; i++) {
    const err = setError(sets[i][0], sets[i][1]);
    if (err) return `Партия ${i + 1}: ${err}`;
  }
  const need = setsToWin(bestOf);
  let a = 0;
  let b = 0;
  for (const [x, y] of sets) {
    if (a === need || b === need) return "Матч уже закончился, лишние партии";
    if (x > y) a++;
    else b++;
  }
  if (a !== need && b !== need) return `Матч идёт до ${need} побед в партиях`;
  return null;
}

/** 1 — победил первый игрок, 2 — второй, null — результат некорректен */
export function winnerSide(sets: SetScore[], bestOf: number): 1 | 2 | null {
  if (matchResultError(sets, bestOf)) return null;
  const [a, b] = countSets(sets);
  return a > b ? 1 : 2;
}

export function formatSets(sets: SetScore[]): string {
  return sets.map(([a, b]) => `${a}:${b}`).join(", ");
}
