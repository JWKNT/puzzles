# Puzzles

A dependency-free static puzzle archive published at [jehlp.net/puzzles](https://jehlp.net/puzzles/).

The site uses plain HTML, CSS, and JavaScript. Run `node build.mjs` to regenerate the catalogue and all individual puzzle pages from `data/puzzles.json`, then run `node --test tests/static-site.test.mjs` to validate the output.

The shared v2 theme supplies the PNG identity, dropdown, table headings, and mobile
filter disclosure. `lib/puzzle-content.mjs` inserts one PNG-centered divider at the
start of the main puzzle unit, before its introduction and solving links. Complete
examples stay with the rules above it; paired grids and later reference charts
retain their order. Missing or ambiguous main-puzzle links require a reviewed
boundary instead of guessing from the first image or a colon.
Keep authored UI changes in `build.mjs`, `lib/`, and `assets/`, never only in generated pages.
GitHub Pages continues to publish `main` at the repository root.
