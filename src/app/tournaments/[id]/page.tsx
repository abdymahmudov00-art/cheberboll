import { Suspense } from "react";
import type { Metadata } from "next";
import { PageLoading } from "@/components/ui";
import TournamentView from "@/components/pages/tournament/TournamentView";

export const metadata: Metadata = { title: "Турнир" };

type Params = Promise<{ id: string }>;

export default function TournamentPage({ params }: { params: Params }) {
  // params читаем внутри Suspense: так требует режим cacheComponents
  return (
    <Suspense fallback={<PageLoading />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Params }) {
  const { id } = await params;
  return <TournamentView id={id} />;
}
