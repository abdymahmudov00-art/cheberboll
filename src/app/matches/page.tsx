import type { Metadata } from "next";
import MatchesView from "@/components/pages/matches/MatchesView";

export const metadata: Metadata = { title: "Матчи" };

export default function MatchesPage() {
  return <MatchesView />;
}
