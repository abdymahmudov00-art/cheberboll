"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { Player, SetScore, Tournament, TournamentData } from "@/types";
import { AUTOPLAY, PLAYERS, TOURNAMENTS } from "@/data/mock";
import { generateSeedScores } from "@/lib/seed";
import { buildTournament } from "@/lib/tournament";
import { computeRatings, type RatingResult } from "@/lib/rating";
import { demoStore, mergeScores } from "@/lib/demoStore";

const SEED_SCORES = generateSeedScores(PLAYERS, TOURNAMENTS, AUTOPLAY);

interface DataContextValue {
  players: Player[];
  playerById: Record<string, Player>;
  tournaments: Tournament[];
  data: Record<string, TournamentData>;
  rating: RatingResult;
  setMatchScore: (matchId: string, sets: SetScore[] | null) => void;
  createTournament: (t: Omit<Tournament, "id" | "createdByUser">) => string;
  resetDemo: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const demo = useSyncExternalStore(
    demoStore.subscribe,
    demoStore.getSnapshot,
    demoStore.getServerSnapshot,
  );

  const value = useMemo<DataContextValue>(() => {
    const tournaments = [...TOURNAMENTS, ...demo.createdTournaments];
    const scores = mergeScores(SEED_SCORES, demo.scores);
    const data: Record<string, TournamentData> = {};
    for (const t of tournaments) data[t.id] = buildTournament(t, scores);
    const playerById: Record<string, Player> = {};
    for (const p of PLAYERS) playerById[p.id] = p;

    return {
      players: PLAYERS,
      playerById,
      tournaments,
      data,
      rating: computeRatings(PLAYERS, tournaments, data),
      setMatchScore: demoStore.setScore,
      createTournament: (input) => {
        const id = `u${Date.now().toString(36)}`;
        demoStore.addTournament({ ...input, id, createdByUser: true });
        return id;
      },
      resetDemo: demoStore.reset,
    };
  }, [demo]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData нужно использовать внутри DataProvider");
  return ctx;
}
