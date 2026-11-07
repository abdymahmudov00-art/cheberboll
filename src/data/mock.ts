import type { Player, Tournament } from "@/types";

/** Тестовые данные для демо-версии. Позже их заменит backend. */

export const PLAYERS: Player[] = [
  { id: "p1", name: "Азамат Токтогулов", city: "Бишкек", startRating: 742 },
  { id: "p2", name: "Бекжан Абдыраимов", city: "Бишкек", startRating: 715 },
  { id: "p3", name: "Нурлан Осмонов", city: "Ош", startRating: 688 },
  { id: "p4", name: "Айбек Жумабаев", city: "Бишкек", startRating: 664 },
  { id: "p5", name: "Эрлан Сыдыков", city: "Каракол", startRating: 640 },
  { id: "p6", name: "Тимур Исаков", city: "Бишкек", startRating: 618 },
  { id: "p7", name: "Данияр Мамытов", city: "Токмок", startRating: 597 },
  { id: "p8", name: "Улан Кадыров", city: "Бишкек", startRating: 575 },
  { id: "p9", name: "Руслан Асанов", city: "Ош", startRating: 552 },
  { id: "p10", name: "Марат Бейшеналиев", city: "Бишкек", startRating: 530 },
  { id: "p11", name: "Адилет Турдубаев", city: "Кант", startRating: 508 },
  { id: "p12", name: "Чынгыз Эсенов", city: "Бишкек", startRating: 486 },
  { id: "p13", name: "Эмиль Шарипов", city: "Токмок", startRating: 463 },
  { id: "p14", name: "Алмаз Жээнбеков", city: "Бишкек", startRating: 441 },
  { id: "p15", name: "Канат Мырзаев", city: "Каракол", startRating: 420 },
  { id: "p16", name: "Илья Ким", city: "Бишкек", startRating: 398 },
];

export const TOURNAMENTS: Tournament[] = [
  {
    id: "t1",
    name: "Осенний кубок",
    date: "2026-10-12",
    venue: "Клуб Cheber Boll, Бишкек",
    format: "round-robin",
    bestOf: 5,
    playerIds: ["p2", "p3", "p5", "p6", "p9", "p12"],
  },
  {
    id: "t2",
    name: "Турнир выходного дня №14",
    date: "2026-10-26",
    venue: "Клуб Cheber Boll, Бишкек",
    format: "single-elim",
    bestOf: 5,
    playerIds: ["p1", "p4", "p6", "p7", "p8", "p10", "p11", "p13"],
  },
  {
    id: "t3",
    name: "Открытый чемпионат Cheber Boll",
    date: "2026-11-07",
    venue: "Спортзал №2, Бишкек",
    format: "groups-playoff",
    bestOf: 5,
    groupCount: 2,
    advancePerGroup: 2,
    playerIds: ["p1", "p2", "p3", "p4", "p5", "p7", "p8", "p10"],
  },
  {
    id: "t4",
    name: "Кубок ноября",
    date: "2026-11-21",
    venue: "Клуб Cheber Boll, Бишкек",
    format: "single-elim",
    bestOf: 3,
    playerIds: ["p2", "p3", "p5", "p6", "p9", "p11", "p12", "p13", "p14", "p15", "p16", "p8"],
  },
  {
    id: "t5",
    name: "Лига новичков, 3 тур",
    date: "2026-11-28",
    venue: "Клуб Cheber Boll, Бишкек",
    format: "round-robin",
    bestOf: 3,
    playerIds: ["p11", "p12", "p13", "p14", "p15", "p16"],
  },
];

/** Сколько матчей каждого турнира заранее «сыграно» в демо: "all" — все */
export const AUTOPLAY: Record<string, number | "all"> = {
  t1: "all",
  t2: "all",
  t3: 9,
};
