import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../assets/app.js", import.meta.url), "utf8");

function explorer(query = "") {
  const elements = new Map();
  const listeners = {};
  const document = { activeElement: null };
  class Element {
    constructor(dataset = {}) {
      this.dataset = dataset;
      this.listeners = {};
      this.value = "";
      this.children = [];
    }
    set innerHTML(markup) {
      if (this.children.includes(document.activeElement)) document.activeElement = null;
      this.markup = markup;
      this.children = [...markup.matchAll(/<button\b([^>]*)>/g)].map(([, attributes]) => new Element(
        Object.fromEntries([...attributes.matchAll(/data-([\w-]+)="([^"]*)"/g)]
          .map(([, key, value]) => [key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), value])),
      ));
    }
    get innerHTML() { return this.markup || ""; }
    addEventListener(type, callback) { this.listeners[type] = callback; }
    fire(type) { this.listeners[type]?.({ target: this }); }
    focus() { document.activeElement = this; }
    querySelectorAll(selector) {
      if (selector === "input[type=checkbox]") return [];
      return this.children.filter((child) => child.closest(selector));
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    closest(selector) {
      const match = selector.match(/\[data-([\w-]+)\]/);
      if (!match) return null;
      const key = match[1].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      return Object.hasOwn(this.dataset, key) ? this : null;
    }
  }
  const get = (selector) => {
    if (!elements.has(selector)) elements.set(selector, new Element());
    return elements.get(selector);
  };
  Object.assign(document, {
    querySelector: get,
    addEventListener(type, callback) { listeners[type] = callback; },
  });
  const location = new URL(`https://jehlp.net/puzzles/${query}`);
  vm.runInNewContext(source, {
    window: { PUZZLES: [
      { title: "First", slug: "first", published: "2026-01-01", tags: ["Sudoku", "Arrow"] },
      { title: "Second", slug: "second", published: "2026-01-02", tags: ["Sudoku"] },
    ] },
    document,
    URLSearchParams,
    location,
    history: { replaceState(_state, _title, url) { location.href = new URL(url, location).href; } },
  });
  return {
    get, location, document,
    click(element) { element.focus(); listeners.click({ target: element }); },
  };
}

test("filter updates preserve a catalogue's same-page fragment", () => {
  const ui = explorer("?sort=title#puzzle-list");
  assert.equal(ui.location.hash, "#puzzle-list");
  ui.get("#puzzle-search").value = "First";
  ui.get("#puzzle-search").fire("input");
  assert.equal(ui.location.searchParams.get("q"), "First");
  assert.equal(ui.location.hash, "#puzzle-list");
});

test("selecting a row tag moves focus to its new active-filter control", () => {
  const ui = explorer();
  const tag = ui.get("#puzzle-rows").querySelectorAll("[data-tag]").find((button) => button.dataset.tag === "Arrow");
  ui.click(tag);
  assert.equal(ui.get("#result-status").textContent, "1 puzzle shown");
  assert.equal(ui.document.activeElement?.dataset.removeTag, "Arrow");
  assert.notEqual(ui.document.activeElement, tag, "focus does not stay on the removed row node");
});

test("removing filter chips retains keyboard focus, including the last chip", () => {
  const ui = explorer("?tag=Sudoku,Arrow");
  const first = ui.get("#active-chips").querySelector("[data-remove-tag]");
  ui.click(first);
  assert.equal(ui.document.activeElement?.dataset.removeTag, "Arrow");
  ui.click(ui.document.activeElement);
  assert.equal(ui.document.activeElement, ui.get("#puzzle-search"));
  assert.equal(ui.get("#result-status").textContent, "2 puzzles shown");
});

test("clearing an empty result moves focus away from its disappearing reset", () => {
  const ui = explorer("?q=unmatched-fixture");
  assert.equal(ui.get("#empty-state").hidden, false);
  ui.get("#empty-reset").focus();
  ui.get("#empty-reset").fire("click");
  assert.equal(ui.get("#empty-state").hidden, true);
  assert.equal(ui.document.activeElement, ui.get("#puzzle-search"));
});
