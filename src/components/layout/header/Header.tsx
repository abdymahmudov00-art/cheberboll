import { Suspense } from "react";
import Link from "next/link";
import NavLinks from "./NavLinks";
import { NAV_ITEMS } from "./navItems";
import styles from "./header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.ball} aria-hidden />
          Cheber Boll
        </Link>
        <Suspense
          fallback={
            <nav className={styles.nav}>
              {NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className={styles.link}>
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
