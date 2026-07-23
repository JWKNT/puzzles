import type { Metadata } from "next";
import { Catalogue } from "./components/Catalogue";
import { puzzleSummaries } from "./lib/puzzles";

export const metadata: Metadata = {
  title: "Puzzles",
  description: "An archive of original logic puzzles.",
};

export default function Home() {
  return (
    <main className="site-main list-page">
      <Catalogue puzzles={puzzleSummaries} />
    </main>
  );
}
