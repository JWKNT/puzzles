import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../components/SiteHeader";
import { difficultyName, formatDate, getPuzzle, puzzles } from "../../lib/puzzles";

export function generateStaticParams() {
  return puzzles.map((puzzle) => ({ slug: puzzle.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const puzzle = getPuzzle(slug);
  if (!puzzle) return { title: "Puzzle not found" };
  return {
    title: `${puzzle.title} — KNT Puzzles`,
    description: `Rules, images, and solving links for ${puzzle.title}, an original logic puzzle by KNT.`,
  };
}

export default async function PuzzlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const puzzle = getPuzzle(slug);
  if (!puzzle) notFound();

  const index = puzzles.findIndex((item) => item.id === puzzle.id);
  const newer = index > 0 ? puzzles[index - 1] : null;
  const older = index < puzzles.length - 1 ? puzzles[index + 1] : null;

  return (
    <>
      <SiteHeader />
      <main className="site-main puzzle-page">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Archive</Link><span aria-hidden="true">/</span><span>{puzzle.id}</span>
        </nav>

        <header className="puzzle-hero">
          <div>
            <p className="eyebrow">Original logic puzzle &middot; {puzzle.id}</p>
            <h1>{puzzle.title}</h1>
            <p className="puzzle-byline">By KNT &middot; {formatDate(puzzle.published)}</p>
          </div>
          <a className="source-button" href={puzzle.sourceUrl} target="_blank" rel="noreferrer">
            View original on LMD <span aria-hidden="true">↗</span>
          </a>
        </header>

        <div className="puzzle-layout">
          <article className="puzzle-article">
            <div className="article-label">Rules &amp; puzzle</div>
            <div className="puzzle-content" dangerouslySetInnerHTML={{ __html: puzzle.contentHtml }} />
            {puzzle.solutionCode && (
              <section className="solution-code">
                <h2>Solution code</h2>
                <div dangerouslySetInnerHTML={{ __html: puzzle.solutionCode }} />
                <p className="solution-note">Submit your answer on the original Logic Masters Germany page.</p>
              </section>
            )}
          </article>

          <aside className="puzzle-meta" aria-label="Puzzle details">
            <h2>Details</h2>
            <dl>
              <div><dt>Published</dt><dd>{formatDate(puzzle.published)}</dd></div>
              <div><dt>Difficulty</dt><dd>{difficultyName(puzzle.difficulty)}</dd></div>
              <div><dt>LMD rating</dt><dd>{puzzle.rating ? `${puzzle.rating}%` : "Not rated"}</dd></div>
              <div><dt>LMD solves</dt><dd>{puzzle.solved.toLocaleString("en-US")}</dd></div>
              <div><dt>LMD ID</dt><dd>{puzzle.id}</dd></div>
            </dl>
            {puzzle.tags.length > 0 && (
              <div className="tag-list" aria-label="Puzzle tags">
                {puzzle.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            )}
          </aside>
        </div>

        <nav className="puzzle-pagination" aria-label="Adjacent puzzles">
          {newer ? <Link href={`/puzzles/${newer.slug}`}><span>Newer</span>{newer.title}</Link> : <span />}
          {older ? <Link href={`/puzzles/${older.slug}`}><span>Older</span>{older.title}</Link> : <span />}
        </nav>
      </main>
      <footer className="site-footer"><span>JWKNT &middot; Puzzle archive</span><Link href="/">All puzzles</Link></footer>
    </>
  );
}
