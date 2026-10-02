# Puzzle archive UI

Read `../site-theme/PHILOSOPHY.md`, `../site-theme/docs/DESIGN-SYSTEM.md`, and
`../site-theme/docs/COMPONENTS.md` before changing shared presentation. This public
126-puzzle archive is separate from the private Jekyll source in `../site`.

Preserve `data/puzzles.json`, diagram files, published slugs, solving links, and
the ordering of rules, examples, main grids, and reference charts. Make UI edits
in `build.mjs` / `lib/` / `assets/`, run `npm run build` and `npm test`, then inspect ordinary
and multi-image pages in both themes and narrow/wide layouts. Publish shared
assets before consumers. Existing Pages configuration and Sites metadata remain
unchanged unless the user asks for a hosting change.

Place the divider before the whole main puzzle unit (lead-in, solve links, grids),
after complete examples. Never separate a colon-ended introduction from its image.
The content helper uses named primary solve links with reviewed source anchors for
exceptions. Missing/ambiguous boundaries fail the build; inspect the new article
instead of reverting to first-image or punctuation heuristics. Preserve all text.

The main unit uses one `.puzzle-sheet`, with a distinct transition ornament as its
top edge. Keep examples outside and all main grids, notes and references inside.
Group only a verified leading solver-only run into `.puzzle-actions`; do not move
post-grid links or flatten arbitrary prose. Stripping generated wrappers must
recover the exact source HTML apart from the existing local image-path rewrite.

## Original technical writing

Use ASD-STE100 Issue 9 for original explanatory text, instructions, and interface text.
Read `../site-theme/docs/WRITING-STYLE.md` before a prose change.
Preserve imported reader text, translations, quotations, proper titles, and legal text.
Preserve formulas, formal statements, identifiers, data, and technical meaning.
Preserve NDB fictional dialogue, story text, and item descriptions.
Edit the source of generated pages, then rebuild and test them.
Report the checks performed. Do not claim full compliance without a dictionary and rule review.
