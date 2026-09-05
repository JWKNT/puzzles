import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { puzzleContent } from "../lib/puzzle-content.mjs";

const root = new URL("../", import.meta.url);
const puzzles = JSON.parse(await readFile(new URL("../data/puzzles.json", import.meta.url), "utf8"));
const forbidden = /next(?:\.js)?|_next|solution code|solution-code|by knt|lmd id|difficulty/i;
const escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

test("catalogue is a plain static list", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<table class="puzzle-table ui-table">/);
  assert.match(html, /data\/puzzles\.js/);
  assert.match(html, /assets\/app\.js/);
  assert.match(html, /src="https:\/\/jehlp.net\/site-theme\/v2\/theme\.js"/);
  assert.match(html, /href="https:\/\/jehlp.net\/site-theme\/v2\/base\.css"/);
  assert.match(html, /<select id="sort-select" data-ui-select>/);
  assert.match(html, /data-disclosure="\(max-width: 780px\)"/);
  assert.doesNotMatch(html, forbidden);
  assert.doesNotMatch(html, /<h1(?![^>]*sr-only)/i);
});

test("all puzzle pages preserve content and remove LMD-only metadata", async () => {
  assert.equal(puzzles.length, 126);
  assert.equal(new Set(puzzles.map(({ slug }) => slug)).size, 126);
  for (const puzzle of puzzles) {
    for (const key of ["solutionCode", "publishedText", "difficulty", "rating", "solved", "id"]) {
      assert.ok(!(key in puzzle), `${puzzle.slug} still contains ${key}`);
    }
    const pageUrl = new URL(`../${puzzle.slug}/index.html`, import.meta.url);
    const html = await readFile(pageUrl, "utf8");
    assert.ok(html.includes(escapeHtml(puzzle.title)));
    assert.match(html, /class="site-title" href="\.\.\/">Puzzles/);
    assert.match(html, /src="https:\/\/jehlp.net\/site-theme\/v2\/theme\.js"/);
    assert.match(html, /href="https:\/\/jehlp.net\/site-theme\/v2\/base\.css"/);
    assert.match(html, /class="site-mark"[^>]*marks\/puzzles\.png/);
    assert.equal((html.match(/class="site-divider puzzle-divider"/g) || []).length, 1, puzzle.slug);
    const article = html.match(/<article class="puzzle-content">\n([\s\S]*?)\n      <\/article>/)[1];
    const withoutDivider = article.replace(/<div class="site-divider puzzle-divider"[^>]*><img[^>]*><\/div>\n/, '');
    assert.equal(withoutDivider, puzzle.contentHtml.replace(/(<img\b[^>]*\bsrc=["'])\/puzzles\//gi, '$1../puzzles/'), `${puzzle.slug} must preserve exact rules, diagrams, links and ordering`);
    assert.doesNotMatch(html, forbidden);
    for (const image of puzzle.contentHtml.matchAll(/<img[^>]+src=["']\/puzzles\/([^"']+)/gi)) {
      assert.ok(html.includes(`../puzzles/${image[1]}`));
      await access(new URL(`../puzzles/${image[1]}`, import.meta.url));
    }
  }
});

test("catalogue data contains normalized type tags", async () => {
  const script = await readFile(new URL("../data/puzzles.js", import.meta.url), "utf8");
  assert.match(script, /Chaos Construction/);
  assert.match(script, /U-Bahn/);
  assert.doesNotMatch(script, /Underground|\(Variant\)|publishedText|difficulty|rating|solved/);
  await access(root);
});

test("the divider introduces the whole main puzzle, after any complete example", () => {
  let examplesAbove = 0;
  for (const puzzle of puzzles) {
    const html = puzzleContent(puzzle);
    const [before, after] = html.split('<div class="site-divider puzzle-divider"');
    const imagesAbove = (before.match(/<img\b/g) || []).length;
    const mainFirst = puzzle.assetCount === 1 || [
      "pentomino-sudoku-000a76", "roller-coaster-mit-myxo-000etp",
    ].includes(puzzle.slug);
    assert.equal(imagesAbove, mainFirst ? 0 : 1, `${puzzle.slug}: example must stay with its introduction`);
    examplesAbove += imagesAbove;
    assert.ok(!/>SudokuPad<\/a>/.test(before), `${puzzle.slug}: main solve link must stay with its grid`);
    assert.match(after, /<img[^>]+\.\.\/puzzles\//, puzzle.slug);
    // Reference charts belong after the main grid, never above the divider.
    if (/Pentomino shapes and their corresponding letters:/.test(html)) {
      assert.match(after, /Pentomino shapes and their corresponding letters:[\s\S]*<img/);
    }
  }
  assert.equal(examplesAbove, 48);
});

test("colon lead-ins, long examples, and paired puzzles stay intact", () => {
  for (const slug of [
    "chaos-construction-double-internal-x-sums-000rsn",
    "crypto-japanese-cave-with-three-extraterrestrials-000d1k",
    "loop-with-a-coral-infestation-000evd",
    "crypto-japanese-cave-pentominous-000cql",
  ]) {
    const puzzle = puzzles.find(p => p.slug === slug);
    const html = puzzleContent(puzzle);
    const dividerAt = html.indexOf('class="site-divider puzzle-divider"');
    assert.ok(html.indexOf('asset-01-') < dividerAt, slug);
    assert.ok(html.indexOf('asset-02-') > dividerAt, slug);
    if (slug.startsWith("loop-with-")) {
      assert.ok(html.indexOf("And here is the main puzzle:") > dividerAt);
    }
  }
  const paired = puzzleContent(puzzles.find(p => p.slug === "roller-coaster-mit-myxo-000etp"));
  assert.ok(paired.indexOf('class="site-divider puzzle-divider"') < paired.indexOf('asset-01-'));
  assert.ok(paired.indexOf('asset-01-') < paired.indexOf('asset-02-'));
});

test("boundary selection respects link paragraphs and fails for ambiguous new articles", () => {
  const link = '<a href="https://sudokupad.app/example">SudokuPad</a>';
  const image = '<div><img src="/puzzles/test/main.png"></div>';
  const output = puzzleContent({ slug: "fixture", contentHtml: `Rules.<p><a>\n</a>${link}</p>${image}` });
  assert.match(output, /<\/div>\n<p><a>\n<\/a><a href=/);
  for (const contentHtml of [`Example:${image}`, `${link}${link}${image}`, `${link}No grid`]) {
    assert.throws(() => puzzleContent({ slug: "fixture", contentHtml }), /fixture:/);
  }
  assert.throws(() => puzzleContent({ slug: "loop-with-a-coral-infestation-000evd", contentHtml: `${link}${image}` }), /source anchor changed/);
});
