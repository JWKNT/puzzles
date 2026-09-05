const divider = '<div class="site-divider puzzle-divider" aria-hidden="true"><img src="https://jehlp.net/site-theme/v2/marks/puzzles.png" width="28" height="28" alt=""></div>\n';

// These articles introduce the main grid in prose or put its solve link after
// the grids. Keep the complete introduction / paired puzzle below the boundary.
const mainPuzzleStarts = {
  "loop-with-a-coral-infestation-000evd": '<a>\n\nAnd here is the main puzzle:',
  "roller-coaster-mit-myxo-000etp": '<div style="clear:both;text-align:center">\n<img src="/puzzles/000etp/asset-01-13597adbca.png"',
};

export function puzzleContent({ slug, contentHtml: html }) {
  let boundary;
  if (Object.hasOwn(mainPuzzleStarts, slug)) {
    const anchor = mainPuzzleStarts[slug];
    boundary = html.indexOf(anchor);
    if (boundary < 0 || html.indexOf(anchor, boundary + 1) !== -1) {
      throw new Error(`${slug}: review the main-puzzle boundary; its source anchor changed`);
    }
  } else {
    // The imported archive gives the main puzzle one named SudokuPad link (or
    // penpa+ when that is its only solver). Example links use descriptive text.
    // Do not infer sections from image order, a colon, or a short prose excerpt.
    const sudokuPad = [...html.matchAll(/<a\b[^>]*\bhref="[^"]+"[^>]*>SudokuPad<\/a>/gi)];
    const links = sudokuPad.length ? sudokuPad : [...html.matchAll(/<a\b[^>]*\bhref="[^"]+"[^>]*>penpa\+<\/a>/gi)];
    if (links.length !== 1) {
      throw new Error(`${slug}: identify one main-puzzle link or add a reviewed boundary`);
    }
    boundary = links[0].index;
    // A block divider must precede the link's paragraph, not split it. Preserve
    // the importer's empty anchor wrappers and all original source bytes.
    const paragraph = html.slice(0, boundary).match(/<p\b[^>]*>(?:\s|<a>\s*<\/a>)*$/i);
    if (paragraph) boundary = paragraph.index;
  }
  if (!/<img\b/i.test(html.slice(boundary))) {
    throw new Error(`${slug}: the main-puzzle boundary has no following diagram`);
  }
  return (html.slice(0, boundary) + divider + html.slice(boundary))
    .replace(/(<img\b[^>]*\bsrc=["'])\/puzzles\//gi, "$1../puzzles/");
}
