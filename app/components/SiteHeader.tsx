import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="KNT puzzle archive home">
        <span className="wordmark-mark" aria-hidden="true">K</span>
        <span>KNT / Puzzles</span>
      </Link>
      <nav className="site-nav" aria-label="Primary navigation">
        <Link href="/">Archive</Link>
        <a href="https://logic-masters.de/Raetselportal/Benutzer/eingestellt.php?name=KNT" target="_blank" rel="noreferrer">
          LMD <span aria-hidden="true">↗</span>
        </a>
        <ThemeToggle />
      </nav>
    </header>
  );
}
