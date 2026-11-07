import type { Metadata } from "next";
import TournamentsView from "@/components/pages/tournaments/TournamentsView";

export const metadata: Metadata = { title: "Турниры" };

export default function TournamentsPage() {
  return <TournamentsView />;
}
