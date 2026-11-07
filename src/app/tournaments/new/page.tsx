import type { Metadata } from "next";
import CreateTournamentForm from "@/components/pages/tournament-new/CreateTournamentForm";

export const metadata: Metadata = { title: "Новый турнир" };

export default function NewTournamentPage() {
  return <CreateTournamentForm />;
}
