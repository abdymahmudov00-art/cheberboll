"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, NAV_ITEMS, NAV_LINK, NAV_LINK_ACTIVE } from "./navItems";

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className={NAV}>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} className={`${NAV_LINK} ${active ? NAV_LINK_ACTIVE : ""}`}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
