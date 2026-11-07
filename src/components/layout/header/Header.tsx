import { Suspense } from "react";
import Link from "next/link";
import NavLinks from "./NavLinks";
import { NAV, NAV_ITEMS, NAV_LINK } from "./navItems";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-2 px-4 py-3 min-[481px]:flex-row min-[481px]:items-center min-[481px]:justify-between min-[481px]:gap-4">
        <Link href="/" className="flex items-center gap-2.5 whitespace-nowrap text-lg font-bold">
          <span className="h-3.5 w-3.5 rounded-full bg-accent shadow-[inset_-3px_-3px_0_rgba(0,0,0,0.15)]" aria-hidden />
          Cheber Boll
        </Link>
        <Suspense
          fallback={
            <nav className={NAV}>
              {NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className={NAV_LINK}>
                  {item.label}
                </Link>
              ))}
            </nav>
          }
        >
          <NavLinks />
        </Suspense>
      </div>
    </header>
  );
}
