import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const puzzleData = JSON.parse(await readFile(new URL("../app/data/puzzles.json", import.meta.url), "utf8"));

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the full puzzle archive", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Puzzles by KNT<\/title>/i);
  assert.match(html, /126(?:<!-- -->|\s)*puzzles/);
  assert.match(html, /A 38/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton/);
});

test("server-renders an individual mirrored puzzle page", async () => {
  const puzzle = puzzleData[0];
  const response = await render(`/puzzles/${puzzle.slug}`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, new RegExp(puzzle.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(html, /Rules &amp; puzzle/);
  assert.match(html, new RegExp(`/puzzles/${puzzle.id.toLowerCase()}/asset-`));
  assert.match(html, /View original on LMD/);
});

test("archive data is complete and every mirrored image exists", async () => {
  assert.equal(puzzleData.length, 126);
  assert.equal(new Set(puzzleData.map((puzzle) => puzzle.id)).size, 126);
  assert.equal(new Set(puzzleData.map((puzzle) => puzzle.slug)).size, 126);

  for (const puzzle of puzzleData) {
    assert.ok(puzzle.title);
    assert.ok(puzzle.published);
    assert.ok(puzzle.contentHtml);
    for (const match of puzzle.contentHtml.matchAll(/<img[^>]+src=["']([^"']+)/gi)) {
      assert.match(match[1], /^\/puzzles\//);
      await access(new URL(`../public${match[1]}`, import.meta.url));
    }
  }

  await access(new URL("../public/puzzles", import.meta.url));
  await access(projectRoot);
});
