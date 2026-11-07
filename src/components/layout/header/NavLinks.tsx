"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./navItems";
import styles from "./header.module.css";

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.link} ${active ? styles.active : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
