import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const puzzles = JSON.parse(await readFile(join(root, "data/puzzles.json"), "utf8"));

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function displayTags(puzzle) {
  const tags = puzzle.tags.map((tag) => tag.replace(/\s+\(Variant\)$/, ""));
  const underground = tags.indexOf("Underground");
  if (underground !== -1) tags.splice(underground, 1, "U-Bahn");
  if (/\b(?:u-bahn|subway)\b/i.test(puzzle.title) && !tags.includes("U-Bahn")) tags.unshift("U-Bahn");
  return [...new Set(tags)];
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function puzzleContent(html) {
  return html.replace(/(<img\b[^>]*\bsrc=["'])\/puzzles\//gi, "$1../puzzles/");
}

function pageShell({ title, description, assetPrefix = "", body, bodyClass = "" }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="theme-color" content="#ffffff">
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="https://jwknt.github.io/site-theme/v1/base.css">
    <link rel="stylesheet" href="${assetPrefix}assets/styles.css">
  </head>
  <body class="${bodyClass}">
${body}
  </body>
</html>
`;
}

function cataloguePage() {
  return pageShell({
    title: "Puzzles",
    description: "A searchable list of original logic puzzles.",
    bodyClass: "catalogue-page",
    body: `    <a class="skip-link" href="#puzzle-list">Skip to puzzle list</a>
    <main class="page-shell">
      <h1 class="sr-only">Puzzles</h1>
      <section class="toolbar" aria-label="Search and sorting controls">
        <label class="search-control" for="puzzle-search">
          <span>Search</span>
          <input id="puzzle-search" type="search" autocomplete="off" placeholder="Title or puzzle type">
          <kbd>⌘K</kbd>
        </label>
        <span class="toolbar-separator" aria-hidden="true"></span>
        <label class="sort-control" for="sort-select">
          <span>Sort</span>
          <select id="sort-select">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">A–Z</option>
          </select>
        </label>
        <button class="filter-toggle" id="filter-toggle" type="button">Tags <span id="active-filter-count">0</span></button>
        <button class="text-button toolbar-reset" id="reset-filters" type="button">Reset</button>
      </section>

      <section class="archive" aria-label="Puzzle archive">
        <aside class="filters" id="filters" aria-label="Puzzle type filters">
          <div class="filter-heading">
            <h2>Tags</h2>
            <button class="drawer-close" id="drawer-close" type="button" aria-label="Close tags">×</button>
          </div>
          <div id="filter-groups"></div>
        </aside>

        <section class="results" id="puzzle-list" aria-live="polite">
          <p class="sr-only" id="result-status"></p>
          <div class="active-chips" id="active-chips" aria-label="Active filters"></div>
          <div class="puzzle-table-wrap">
            <table class="puzzle-table">
              <thead>
                <tr><th>Puzzle</th><th>Types</th><th>Published</th><th><span class="sr-only">Open</span></th></tr>
              </thead>
              <tbody id="puzzle-rows"></tbody>
            </table>
          </div>
          <div class="puzzle-cards" id="puzzle-cards"></div>
          <div class="empty-state" id="empty-state" hidden>
            <p>No puzzles match those filters.</p>
            <button type="button" id="empty-reset">Clear filters</button>
          </div>
        </section>
      </section>
    </main>
    <div class="drawer-backdrop" id="drawer-backdrop" hidden></div>
    <script src="data/puzzles.js"></script>
    <script src="assets/app.js"></script>`,
  });
}

function tagMarkup(tags) {
  return tags.map((tag) => `<a class="type-tag" href="../?tag=${encodeURIComponent(tag)}">${escapeHtml(tag)}</a>`).join("");
}

function puzzlePage(puzzle, index) {
  const tags = displayTags(puzzle);
  const newer = index > 0 ? puzzles[index - 1] : null;
  const older = index < puzzles.length - 1 ? puzzles[index + 1] : null;
  const adjacent = (item, label) => item
    ? `<a href="../${escapeHtml(item.slug)}/"><span>${label}</span>${escapeHtml(item.title)}</a>`
    : "<span></span>";

  return pageShell({
    title: `${puzzle.title} · Puzzles`,
    description: `Rules and puzzle for ${puzzle.title}.`,
    assetPrefix: "../",
    bodyClass: "detail-page",
    body: `    <main class="detail-shell">
      <nav class="detail-nav" aria-label="Back to puzzle list"><a href="../">← All puzzles</a></nav>
      <header class="puzzle-header">
        <div>
          <h1>${escapeHtml(puzzle.title)}</h1>
          <time datetime="${escapeHtml(puzzle.published)}">${escapeHtml(formatDate(puzzle.published))}</time>
        </div>
        <a class="source-link" href="${escapeHtml(puzzle.sourceUrl)}" target="_blank" rel="noreferrer">Original ↗</a>
      </header>
      <div class="detail-tags" aria-label="Puzzle types">${tagMarkup(tags)}</div>
      <article class="puzzle-content">
${puzzleContent(puzzle.contentHtml)}
      </article>
      <nav class="puzzle-pagination" aria-label="Adjacent puzzles">
        ${adjacent(newer, "Newer")}
        ${adjacent(older, "Older")}
      </nav>
    </main>`,
  });
}

const summaries = puzzles.map((puzzle) => ({
  slug: puzzle.slug,
  title: puzzle.title,
  published: puzzle.published,
  year: Number(puzzle.published.slice(0, 4)),
  tags: displayTags(puzzle),
}));

await mkdir(join(root, "assets"), { recursive: true });
await mkdir(join(root, "data"), { recursive: true });
await writeFile(join(root, "index.html"), cataloguePage());
await writeFile(join(root, "data/puzzles.js"), `window.PUZZLES = ${JSON.stringify(summaries)};\n`);
await writeFile(join(root, ".nojekyll"), "");

for (const [index, puzzle] of puzzles.entries()) {
  const directory = join(root, puzzle.slug);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "index.html"), puzzlePage(puzzle, index));
}

await writeFile(join(root, "generated-pages.json"), `${JSON.stringify(puzzles.map(({ slug }) => slug), null, 2)}\n`);
await writeFile(join(root, "404.html"), pageShell({
  title: "Not found · Puzzles",
  description: "The requested puzzle page was not found.",
  bodyClass: "detail-page",
  body: `    <main class="detail-shell not-found"><p>That puzzle page does not exist.</p><a href="./">Return to the puzzle list</a></main>`,
}));

const dist = join(root, "dist");
await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, "client"), { recursive: true });
await mkdir(join(dist, "server"), { recursive: true });
await mkdir(join(dist, ".openai"), { recursive: true });
for (const entry of ["index.html", "404.html", ".nojekyll", "assets", "data", "puzzles", ...puzzles.map(({ slug }) => slug)]) {
  await cp(join(root, entry), join(dist, "client", entry), { recursive: true });
}
await cp(join(root, ".openai/hosting.json"), join(dist, ".openai/hosting.json"));
await writeFile(join(dist, "server/index.js"), "export default { fetch(request, env) { return env.ASSETS.fetch(request); } };\n");

console.log(`Built ${puzzles.length} puzzle pages with ${summaries.flatMap(({ tags }) => tags).length} tag assignments.`);
