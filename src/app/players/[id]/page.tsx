import { Suspense } from "react";
import type { Metadata } from "next";
import { PageLoading } from "@/components/ui";
import PlayerView from "@/components/pages/player/PlayerView";

export const metadata: Metadata = { title: "Игрок" };

type Params = Promise<{ id: string }>;

export default function PlayerPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Params }) {
  const { id } = await params;
  return <PlayerView id={id} />;
}
