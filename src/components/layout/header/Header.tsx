import { Suspense } from "react";
import Link from "next/link";
import KttfLogo from "@/components/ui/KttfLogo";
import NavLinks from "./NavLinks";
import HeaderControls from "./HeaderControls";
import { NAV, NAV_ITEMS, NAV_LINK } from "./navItems";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-2 px-4 py-3 min-[481px]:flex-row min-[481px]:items-center min-[481px]:justify-between min-[481px]:gap-4">
        <Link href="/" className="flex shrink-0 items-center" aria-label="KTTF — на главную">
          <KttfLogo className="h-11 w-[172px]" />
        </Link>
        <div className="flex w-full items-center justify-between gap-3 min-[481px]:w-auto">
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
        <HeaderControls />
        </div>
      </div>
    </header>
  );
}
