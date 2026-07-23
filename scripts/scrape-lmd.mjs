import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";

const ROOT = process.cwd();
const BASE = "https://logic-masters.de";
const AUTHOR = "KNT";
const DATA_FILE = path.join(ROOT, "app", "data", "puzzles.json");
const ASSET_ROOT = path.join(ROOT, "public", "puzzles");

const headers = {
  "user-agent": "KNT personal puzzle archive (contact: jwknt.github.io)",
  accept: "text/html,application/xhtml+xml,image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8",
};

const monthNumbers = new Map(
  [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ].map((month, index) => [month, String(index + 1).padStart(2, "0")]),
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchOk(url) {
  let lastResponse;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    lastResponse = await fetch(url, { headers, redirect: "follow" });
    if (lastResponse.ok) return lastResponse;
    if (![429, 502, 503, 504].includes(lastResponse.status)) break;
    await sleep(1_000 * 2 ** attempt);
  }
  throw new Error(`${lastResponse.status} ${lastResponse.statusText}: ${url}`);
}

function parsePublishedDate(text) {
  const match = text.match(/Published on\s+(\d{1,2})\.\s+([A-Za-z]+)\s+(\d{4})/i);
  if (!match) return null;
  const [, day, month, year] = match;
  const monthNumber = monthNumbers.get(month.toLowerCase());
  return monthNumber ? `${year}-${monthNumber}-${String(day).padStart(2, "0")}` : null;
}

function safeSlug(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "puzzle";
}

function extensionFor(contentType, url) {
  const type = contentType.split(";")[0].trim().toLowerCase();
  const byType = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "application/pdf": ".pdf",
  };
  if (byType[type]) return byType[type];
  const ext = path.extname(new URL(url).pathname).toLowerCase();
  return /^\.[a-z0-9]{1,6}$/.test(ext) ? ext : ".bin";
}

async function mirrorAsset(sourceUrl, puzzleId, index) {
  const absoluteUrl = new URL(sourceUrl, BASE).href;
  const response = await fetchOk(absoluteUrl);
  const bytes = Buffer.from(await response.arrayBuffer());
  const extension = extensionFor(response.headers.get("content-type") || "", absoluteUrl);
  const digest = createHash("sha1").update(bytes).digest("hex").slice(0, 10);
  const filename = `asset-${String(index).padStart(2, "0")}-${digest}${extension}`;
  const directory = path.join(ASSET_ROOT, puzzleId.toLowerCase());
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), bytes);
  return `/puzzles/${puzzleId.toLowerCase()}/${filename}`;
}

async function catalogueIds() {
  const ids = [];
  for (let start = 0; ; start += 20) {
    const url = `${BASE}/Raetselportal/Benutzer/eingestellt.php?start=${start}&name=${AUTHOR}`;
    const html = await (await fetchOk(url)).text();
    const $ = cheerio.load(html);
    const pageIds = [];
    $('a[href*="/Raetselportal/Raetsel/zeigen.php?id="]').each((_, element) => {
      const match = ($(element).attr("href") || "").match(/[?&]id=([A-Za-z0-9]+)/);
      if (match) pageIds.push(match[1]);
    });
    const uniquePageIds = [...new Set(pageIds)];
    if (!uniquePageIds.length) break;
    ids.push(...uniquePageIds);
    process.stdout.write(`Catalogue ${start + 1}-${start + uniquePageIds.length}\n`);
    if (uniquePageIds.length < 20) break;
    await sleep(120);
  }
  return [...new Set(ids)];
}

async function scrapePuzzle(id) {
  const sourceUrl = `${BASE}/Raetselportal/Raetsel/zeigen.php?chlang=en&id=${id}`;
  const html = await (await fetchOk(sourceUrl)).text();
  const $ = cheerio.load(html, { decodeEntities: false });
  const content = $(".rp_html").first();
  if (!content.length) throw new Error(`Puzzle ${id} has no .rp_html content`);

  const title = $(".rp_titel h2").first().text().trim();
  const publishedText = $(".rp_eingestellt").first().text().replace(/\s+/g, " ").trim();
  const published = parsePublishedDate(publishedText);

  let assetIndex = 0;
  const mirrored = new Map();
  const imageElements = content.find("img").toArray();
  for (const element of imageElements) {
    const source = $(element).attr("src");
    if (!source) continue;
    const absolute = new URL(source, BASE).href;
    let local = mirrored.get(absolute);
    if (!local) {
      assetIndex += 1;
      local = await mirrorAsset(absolute, id, assetIndex);
      mirrored.set(absolute, local);
    }
    $(element)
      .attr("src", local)
      .attr("loading", "lazy")
      .attr("decoding", "async");
  }

  const fileLinks = content.find('a[href^="/Dateien/"], a[href^="https://logic-masters.de/Dateien/"], a[href^="http://logic-masters.de/Dateien/"]').toArray();
  for (const element of fileLinks) {
    const source = $(element).attr("href");
    if (!source) continue;
    const absolute = new URL(source, BASE).href;
    let local = mirrored.get(absolute);
    if (!local) {
      assetIndex += 1;
      local = await mirrorAsset(absolute, id, assetIndex);
      mirrored.set(absolute, local);
    }
    $(element).attr("href", local);
  }

  content.find("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href || href.startsWith("#") || href.startsWith("/puzzles/")) return;
    try {
      $(element).attr("href", new URL(href, BASE).href);
    } catch {
      // Preserve malformed author HTML exactly when it cannot be resolved.
    }
  });

  const statsTable = $(".rightcolumn .box table").first().text().replace(/\s+/g, " ");
  const difficulty = Number($(".rightcolumn .box table img").first().attr("alt")) || null;
  const rating = Number(statsTable.match(/Rating:\s*(\d+)/i)?.[1]) || null;
  const solved = Number(statsTable.match(/Solved:\s*(\d+)/i)?.[1]) || 0;
  const tags = $(".rp_tags a").map((_, element) => $(element).text().trim()).get().filter(Boolean);
  const solutionCode = $(".rp_loesungscode_descr").first().html()?.trim() || "";

  return {
    id,
    slug: `${safeSlug(title)}-${id.toLowerCase()}`,
    title,
    published,
    publishedText,
    difficulty,
    rating,
    solved,
    tags,
    contentHtml: content.html()?.trim() || "",
    solutionCode,
    sourceUrl,
    assetCount: mirrored.size,
  };
}

await mkdir(path.dirname(DATA_FILE), { recursive: true });
await mkdir(ASSET_ROOT, { recursive: true });

const ids = await catalogueIds();
const puzzles = [];
for (let index = 0; index < ids.length; index += 1) {
  const id = ids[index];
  try {
    const puzzle = await scrapePuzzle(id);
    puzzles.push(puzzle);
    process.stdout.write(`[${index + 1}/${ids.length}] ${id} ${puzzle.title} (${puzzle.assetCount} assets)\n`);
  } catch (error) {
    console.error(`[${index + 1}/${ids.length}] ${id} FAILED`, error);
    throw error;
  }
  await sleep(300);
}

puzzles.sort((a, b) => (b.published || "").localeCompare(a.published || "") || b.id.localeCompare(a.id));
await writeFile(DATA_FILE, `${JSON.stringify(puzzles, null, 2)}\n`, "utf8");
console.log(`Wrote ${puzzles.length} puzzles to ${path.relative(ROOT, DATA_FILE)}`);
