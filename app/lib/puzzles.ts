import puzzleData from "../data/puzzles.json";

export type Puzzle = {
  id: string;
  slug: string;
  title: string;
  published: string | null;
  publishedText: string;
  difficulty: number | null;
  rating: number | null;
  solved: number;
  tags: string[];
  contentHtml: string;
  sourceUrl: string;
  assetCount: number;
};

export type PuzzleSummary = Pick<Puzzle, "id" | "slug" | "title" | "difficulty" | "rating" | "solved" | "tags"> & {
  published: string;
  year: number;
  thumbnail: string | null;
};

export const puzzles = puzzleData as Puzzle[];

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

function withBasePath(path: string) {
  return basePath && path.startsWith("/") ? `${basePath}${path}` : path;
}

export function puzzleContentHtml(html: string) {
  return html.replace(
    /(<img\b[^>]*\bsrc=["'])(\/[^"']+)(["'])/gi,
    (_match, before: string, path: string, after: string) => `${before}${withBasePath(path)}${after}`,
  );
}

function finalPuzzleImage(html: string) {
  const images = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
  return images.at(-1)?.[1] || null;
}

export const puzzleSummaries: PuzzleSummary[] = puzzles.map((puzzle) => ({
  id: puzzle.id,
  slug: puzzle.slug,
  title: puzzle.title,
  published: puzzle.published || "",
  year: Number(puzzle.published?.slice(0, 4)) || 0,
  difficulty: puzzle.difficulty,
  rating: puzzle.rating,
  solved: puzzle.solved,
  tags: puzzle.tags,
  thumbnail: withBasePath(finalPuzzleImage(puzzle.contentHtml) || "") || null,
}));

export function getPuzzle(slug: string) {
  return puzzles.find((puzzle) => puzzle.slug === slug);
}

export function formatDate(date: string | null) {
  if (!date) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })
    .format(new Date(`${date}T00:00:00Z`));
}

export function difficultyName(value: number | null) {
  if (value === null) return "Unrated";
  return ["", "Very easy", "Easy", "Medium", "Hard", "Very hard"][value] || `Level ${value}`;
}
