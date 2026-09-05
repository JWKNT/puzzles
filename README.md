# Puzzles

A dependency-free static puzzle archive published at [jehlp.net/puzzles](https://jehlp.net/puzzles/).

The site uses plain HTML, CSS, and JavaScript. Run `node build.mjs` to regenerate the catalogue and all individual puzzle pages from `data/puzzles.json`, then run `node --test tests/static-site.test.mjs` to validate the output.

The shared v2 theme supplies the PNG identity, dropdown, table headings, and mobile
filter disclosure. The generator inserts one PNG-centered divider before the first
diagram; original rules, links, examples, and reference images retain their order.
Keep authored UI changes in `build.mjs` and `assets/`, never only in generated pages.
GitHub Pages continues to publish `main` at the repository root.
