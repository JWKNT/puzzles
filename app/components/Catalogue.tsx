"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PuzzleSummary } from "../lib/puzzles";
import { ThemeToggle } from "./ThemeToggle";

type Sort = "newest" | "oldest" | "title";

export function Catalogue({ puzzles }: { puzzles: PuzzleSummary[] }) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");
  const [sort, setSort] = useState<Sort>("newest");

  const years = useMemo(
    () => [...new Set(puzzles.map((puzzle) => puzzle.year).filter(Boolean))].sort((a, b) => b - a),
    [puzzles],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return puzzles
      .filter((puzzle) => {
        const haystack = [puzzle.title, ...puzzle.tags].join(" ").toLowerCase();
        return (
          (!normalizedQuery || haystack.includes(normalizedQuery)) &&
          (year === "all" || puzzle.year === Number(year))
        );
      })
      .sort((a, b) => {
        if (sort === "oldest") return a.published.localeCompare(b.published);
        if (sort === "title") return a.title.localeCompare(b.title);
        return b.published.localeCompare(a.published);
      });
  }, [puzzles, query, sort, year]);

  const clearFilters = () => {
    setQuery("");
    setYear("all");
    setSort("newest");
  };

  return (
    <section className="catalogue" aria-label="Puzzle list">
      <div className="filters" role="search">
        <label className="search-field">
          <span>Search</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title or puzzle type" />
        </label>
        <label>
          <span>Year</span>
          <select value={year} onChange={(event) => setYear(event.target.value)}>
            <option value="all">All years</option>
            {years.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>
          <span>Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">A&ndash;Z</option>
          </select>
        </label>
        <button className="reset-button" type="button" onClick={clearFilters}>Reset</button>
        <ThemeToggle />
      </div>

      {filtered.length ? (
        <div className="puzzle-grid">
          {filtered.map((puzzle) => (
            <article className="puzzle-card" key={puzzle.id}>
              <Link className="puzzle-card-link" href={`/${puzzle.slug}`}>
                <div className="puzzle-thumbnail">
                  {puzzle.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={puzzle.thumbnail} alt="" loading="lazy" />
                  ) : <span className="thumbnail-placeholder" aria-hidden="true">{puzzle.id}</span>}
                </div>
                <div className="puzzle-card-body">
                  <div className="card-kicker"><time dateTime={puzzle.published}>{puzzle.year}</time></div>
                  <h3>{puzzle.title}</h3>
                  <div className="card-footer"><span aria-hidden="true">View puzzle &rarr;</span></div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state"><p>No puzzles match those filters.</p><button type="button" onClick={clearFilters}>Clear filters</button></div>
      )}
    </section>
  );
}
