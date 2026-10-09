import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Wrenfold is opt-in for puzzle prose, while solve actions keep the UI font', async () => {
  const css = await readFile(new URL('../assets/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.puzzle-content \{ font-family: var\(--reading, var\(--serif\)\);/);
  assert.equal((css.match(/--reading/g) || []).length, 1);
  assert.match(css, /\.puzzle-actions a\[href\], \.puzzle-sheet-body > a\[href\] \{[^}]*font: var\(--text-ui\)\/1\.4 var\(--ui, var\(--serif\)\);/);
});
