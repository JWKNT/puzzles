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
  assert.match(html, /<title>Puzzles<\/title>/i);
  assert.match(html, /A 38/);
  assert.doesNotMatch(html, /126(?:<!-- -->|\s)*puzzles/);
  assert.doesNotMatch(html, /id="catalogue-heading">Puzzles/);
  assert.doesNotMatch(html, /Puzzles by KNT|KNT \/ Puzzles|Personal puzzle archive|By KNT|JWKNT|LMD ID|Difficulty|react-loading-skeleton/);

  for (const puzzle of puzzleData.filter((item) => item.assetCount > 1)) {
    const images = [...puzzle.contentHtml.matchAll(/<img[^>]+src=["']([^"']+)/gi)];
    assert.ok(html.includes(images.at(-1)[1]), `${puzzle.id} should use its final puzzle image`);
    assert.ok(!html.includes(images[0][1]), `${puzzle.id} should not use its example image`);
  }
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
  assert.doesNotMatch(html, /Puzzles by KNT|Personal puzzle archive|By KNT|JWKNT|LMD ID|Difficulty/);
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

  const multiImagePuzzles = puzzleData.filter((puzzle) => puzzle.assetCount > 1);
  assert.ok(multiImagePuzzles.length > 0);
  for (const puzzle of multiImagePuzzles) {
    const images = [...puzzle.contentHtml.matchAll(/<img[^>]+src=["']([^"']+)/gi)];
    assert.ok(images.length > 1);
    assert.notEqual(images[0][1], images.at(-1)[1]);
  }

  await access(new URL("../public/puzzles", import.meta.url));
  await access(projectRoot);
});
