import type { Metadata } from "next";
import { Catalogue } from "./components/Catalogue";
import { SiteHeader } from "./components/SiteHeader";
import { puzzleSummaries } from "./lib/puzzles";

export const metadata: Metadata = {
  title: "Puzzles",
  description: "An archive of original logic puzzles.",
};

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="site-main">
        <Catalogue puzzles={puzzleSummaries} />
      </main>
    </>
  );
}
