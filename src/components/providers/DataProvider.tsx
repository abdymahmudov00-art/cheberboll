"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { MatchResult, Player, Tournament, TournamentData } from "@/types";
import { AUTOPLAY, DEMO_WALKOVERS, PLAYERS, TOURNAMENTS } from "@/data/mock";
import { generateSeedResults } from "@/lib/seed";
import { buildTournament } from "@/lib/tournament";
import { computeRatings, type RatingResult } from "@/lib/rating";
import { demoStore, mergeResults, type LiveMatch } from "@/lib/demoStore";

const SEED_RESULTS = generateSeedResults(PLAYERS, TOURNAMENTS, AUTOPLAY, DEMO_WALKOVERS);

interface DataContextValue {
  players: Player[];
  playerById: Record<string, Player>;
  tournaments: Tournament[];
  data: Record<string, TournamentData>;
  rating: RatingResult;
  /** Матчи за столами: id матча → стол и время вызова */
  live: Record<string, LiveMatch>;
  setMatchResult: (matchId: string, result: MatchResult | null) => void;
  startMatch: (matchId: string, table: number) => void;
  cancelMatch: (matchId: string) => void;
  createTournament: (t: Omit<Tournament, "id" | "createdByUser">) => string;
  createPlayer: (p: Omit<Player, "id" | "createdByUser">) => string;
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
    const players = [...PLAYERS, ...demo.createdPlayers];
    const tournaments = [...TOURNAMENTS, ...demo.createdTournaments];
    const results = mergeResults(SEED_RESULTS, demo.results);
    const data: Record<string, TournamentData> = {};
    for (const t of tournaments) data[t.id] = buildTournament(t, results);
    const playerById: Record<string, Player> = {};
    for (const p of players) playerById[p.id] = p;

    return {
      players,
      playerById,
      tournaments,
      data,
      rating: computeRatings(players, tournaments, data),
      live: demo.live,
      setMatchResult: demoStore.setResult,
      startMatch: demoStore.startMatch,
      cancelMatch: demoStore.cancelMatch,
      createTournament: (input) => {
        const id = `u${Date.now().toString(36)}`;
        demoStore.addTournament({ ...input, id, createdByUser: true });
        return id;
      },
      createPlayer: (input) => {
        const id = `np${Date.now().toString(36)}`;
        demoStore.addPlayer({ ...input, id, createdByUser: true });
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
