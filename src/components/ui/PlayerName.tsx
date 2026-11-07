"use client";

import Link from "next/link";
import { useData } from "@/components/providers/DataProvider";

/** Имя игрока со ссылкой на профиль. null — соперник ещё не определён. */
export function PlayerName({ id, bold = false }: { id: string | null; bold?: boolean }) {
  const { playerById } = useData();
  if (!id) return <span className="text-muted italic">—</span>;
  const p = playerById[id];
  if (!p) return <span className="text-muted">Неизвестный игрок</span>;
  return (
    <Link href={`/players/${id}`} className={`hover:text-accent hover:underline ${bold ? "font-semibold" : ""}`}>
      {p.name}
    </Link>
  );
}
