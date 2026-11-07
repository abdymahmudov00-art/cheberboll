import type { Metadata } from "next";
import RatingsView from "@/components/pages/ratings/RatingsView";

export const metadata: Metadata = { title: "Рейтинг" };

export default function RatingsPage() {
  return <RatingsView />;
}
