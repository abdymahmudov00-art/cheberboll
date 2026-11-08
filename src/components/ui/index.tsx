"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { TournamentStatus } from "@/types";
import { useI18n } from "@/hooks/useI18n";

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <div className="mt-1 text-muted">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-card ${className}`}>{children}</div>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">{children}</h2>
      {action}
    </div>
  );
}

const STATUS_STYLES: Record<TournamentStatus, string> = {
  live: "bg-accent text-white",
  upcoming: "bg-accent-soft text-accent",
  finished: "bg-foreground/10 text-muted",
};

export function StatusBadge({ status }: { status: TournamentStatus }) {
  const { t } = useI18n();
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {status === "live" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
      {t(`status.${status}`)}
    </span>
  );
}

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "ghost" }) {
  const styles =
    variant === "primary"
      ? "bg-accent text-white hover:opacity-90"
      : "border border-border bg-card hover:bg-foreground/5";
  return (
    <Link href={href} className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition ${styles}`}>
      {children}
    </Link>
  );
}

export function Delta({ value }: { value: number }) {
  if (value === 0) return <span className="text-muted">0</span>;
  return (
    <span className={value > 0 ? "text-win" : "text-loss"}>
      {value > 0 ? `+${value}` : `−${Math.abs(value)}`}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted">{children}</div>;
}

export function PageLoading() {
  const { t } = useI18n();
  return <div className="py-16 text-center text-muted">{t("loading")}</div>;
}
