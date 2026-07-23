import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="home-link" href="/">Puzzles</Link>
      <ThemeToggle />
    </header>
  );
}
