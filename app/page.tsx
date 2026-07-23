import type { Metadata } from "next";
import { Catalogue } from "./components/Catalogue";
import { SiteHeader } from "./components/SiteHeader";
import { puzzleSummaries } from "./lib/puzzles";

export const metadata: Metadata = {
  title: "Puzzles by KNT",
  description: "A personal archive of original logic puzzles by KNT.",
};

export default function Home() {
  const years = puzzleSummaries.map((puzzle) => puzzle.year).filter(Boolean);
  const firstYear = Math.min(...years);
  const latestYear = Math.max(...years);

  return (
    <>
      <SiteHeader />
      <main className="site-main">
        <section className="hero" aria-labelledby="archive-title">
          <p className="eyebrow">Personal puzzle archive</p>
          <h1 id="archive-title">Puzzles by KNT</h1>
          <p className="hero-copy">
            Original logic puzzles, hybrids, and experiments collected from my
            years publishing on Logic Masters Germany.
          </p>
          <dl className="archive-stats" aria-label="Archive summary">
            <div><dt>Puzzles</dt><dd>{puzzleSummaries.length}</dd></div>
            <div><dt>Archive</dt><dd>{firstYear}&ndash;{latestYear}</dd></div>
            <div><dt>Author</dt><dd>KNT</dd></div>
          </dl>
        </section>

        <Catalogue puzzles={puzzleSummaries} />
      </main>
      <footer className="site-footer">
        <span>JWKNT &middot; Puzzle archive</span>
        <a href="https://logic-masters.de/Raetselportal/Benutzer/eingestellt.php?name=KNT" target="_blank" rel="noreferrer">
          Original LMD catalogue <span aria-hidden="true">↗</span>
        </a>
      </footer>
    </>
  );
}
