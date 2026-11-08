export const NAV_ITEMS = [
  { href: "/tournaments", label: "Турниры", key: "nav.tournaments" },
  { href: "/ratings", label: "Рейтинг", key: "nav.ratings" },
  { href: "/matches", label: "Матчи", key: "nav.matches" },
] as const;

/** Стили ссылок меню (Tailwind). CSS-модули не используем: в этой сборке они не подхватываются. */
export const NAV_LINK =
  "whitespace-nowrap rounded-lg px-3 py-1.5 text-[0.95rem] text-muted transition hover:bg-foreground/10 hover:text-foreground";
export const NAV_LINK_ACTIVE = "bg-accent-soft !text-accent";
export const NAV = "flex gap-1 overflow-x-auto";
