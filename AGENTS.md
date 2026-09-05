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
