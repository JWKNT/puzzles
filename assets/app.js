(() => {
  "use strict";

  const puzzles = Array.isArray(window.PUZZLES) ? window.PUZZLES : [];
  const state = { query: "", sort: "newest", tags: new Set() };
  const elements = {
    search: document.querySelector("#puzzle-search"),
    sort: document.querySelector("#sort-select"),
    filterGroups: document.querySelector("#filter-groups"),
    rows: document.querySelector("#puzzle-rows"),
    cards: document.querySelector("#puzzle-cards"),
    table: document.querySelector(".puzzle-table-wrap"),
    chips: document.querySelector("#active-chips"),
    status: document.querySelector("#result-status"),
    empty: document.querySelector("#empty-state"),
    reset: document.querySelector("#reset-filters"),
    emptyReset: document.querySelector("#empty-reset"),
    filters: document.querySelector("#filters"),
    filterToggle: document.querySelector("#filter-toggle"),
    drawerClose: document.querySelector("#drawer-close"),
    backdrop: document.querySelector("#drawer-backdrop"),
    activeFilterCount: document.querySelector("#active-filter-count"),
  };

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const formatDate = (date) => new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));

  function tagCounts() {
    const counts = new Map();
    for (const puzzle of puzzles) {
      for (const tag of puzzle.tags) counts.set(tag, (counts.get(tag) || 0) + 1);
    }
    return [...counts.entries()].sort(([tagA, countA], [tagB, countB]) => countB - countA || tagA.localeCompare(tagB));
  }

  function renderFilters() {
    elements.filterGroups.innerHTML = tagCounts().map(([tag, count]) => `
      <label class="filter-option">
        <input type="checkbox" value="${escapeHtml(tag)}">
        <span class="fake-check" aria-hidden="true"></span>
        <span>${escapeHtml(tag)}</span>
        <span class="option-count">${count}</span>
      </label>`).join("");

    elements.filterGroups.addEventListener("change", (event) => {
      const input = event.target.closest("input[type=checkbox]");
      if (!input) return;
      input.checked ? state.tags.add(input.value) : state.tags.delete(input.value);
      render();
    });
  }

  function filteredPuzzles() {
    const tokens = state.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return puzzles.filter((puzzle) => {
      const searchable = `${puzzle.title} ${puzzle.tags.join(" ")}`.toLowerCase();
      return tokens.every((token) => searchable.includes(token)) && [...state.tags].every((tag) => puzzle.tags.includes(tag));
    }).sort((a, b) => {
      if (state.sort === "oldest") return a.published.localeCompare(b.published) || a.title.localeCompare(b.title);
      if (state.sort === "title") return a.title.localeCompare(b.title);
      return b.published.localeCompare(a.published) || a.title.localeCompare(b.title);
    });
  }

  const tagsMarkup = (tags) => tags.map((tag) => `<button class="type-tag" type="button" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join("");

  function rowMarkup(puzzle) {
    return `<tr>
      <td><a class="puzzle-name" href="${escapeHtml(puzzle.slug)}/">${escapeHtml(puzzle.title)}</a></td>
      <td><div class="row-tags">${tagsMarkup(puzzle.tags)}</div></td>
      <td><time datetime="${escapeHtml(puzzle.published)}">${escapeHtml(formatDate(puzzle.published))}</time></td>
      <td><a class="row-arrow" href="${escapeHtml(puzzle.slug)}/" aria-label="Open ${escapeHtml(puzzle.title)}">→</a></td>
    </tr>`;
  }

  function cardMarkup(puzzle) {
    return `<article class="puzzle-card">
      <a class="puzzle-name" href="${escapeHtml(puzzle.slug)}/">${escapeHtml(puzzle.title)}</a>
      <a class="row-arrow" href="${escapeHtml(puzzle.slug)}/" aria-label="Open ${escapeHtml(puzzle.title)}">→</a>
      <div class="row-tags">${tagsMarkup(puzzle.tags)}</div>
      <time datetime="${escapeHtml(puzzle.published)}">${escapeHtml(formatDate(puzzle.published))}</time>
    </article>`;
  }

  function renderChips() {
    elements.chips.innerHTML = [...state.tags]
      .map((tag) => `<button class="chip" type="button" data-remove-tag="${escapeHtml(tag)}">${escapeHtml(tag)} ×</button>`)
      .join("");
    elements.activeFilterCount.textContent = String(state.tags.size);
  }

  function syncUrl() {
    const params = new URLSearchParams();
    if (state.query) params.set("q", state.query);
    if (state.sort !== "newest") params.set("sort", state.sort);
    if (state.tags.size) params.set("tag", [...state.tags].join(","));
    history.replaceState(null, "", `${location.pathname}${params.size ? `?${params}` : ""}`);
  }

  function render() {
    const current = filteredPuzzles();
    elements.rows.innerHTML = current.map(rowMarkup).join("");
    elements.cards.innerHTML = current.map(cardMarkup).join("");
    elements.table.hidden = current.length === 0;
    elements.cards.hidden = current.length === 0;
    elements.empty.hidden = current.length !== 0;
    elements.status.textContent = `${current.length} puzzle${current.length === 1 ? "" : "s"} shown`;
    renderChips();
    syncUrl();
  }

  function syncChecks() {
    elements.filterGroups.querySelectorAll("input[type=checkbox]").forEach((input) => {
      input.checked = state.tags.has(input.value);
    });
  }

  function selectTag(tag) {
    state.tags.add(tag);
    syncChecks();
    render();
  }

  function reset() {
    state.query = "";
    state.sort = "newest";
    state.tags.clear();
    elements.search.value = "";
    elements.sort.value = "newest";
    syncChecks();
    render();
  }

  function closeFilters() {
    elements.filters.classList.remove("is-open");
    elements.backdrop.hidden = true;
  }

  function restoreState() {
    const params = new URLSearchParams(location.search);
    state.query = params.get("q") || "";
    state.sort = ["newest", "oldest", "title"].includes(params.get("sort")) ? params.get("sort") : "newest";
    (params.get("tag") || "").split(",").filter(Boolean).forEach((tag) => state.tags.add(tag));
    elements.search.value = state.query;
    elements.sort.value = state.sort;
    syncChecks();
  }

  document.addEventListener("click", (event) => {
    const tag = event.target.closest("[data-tag]")?.dataset.tag;
    const removeTag = event.target.closest("[data-remove-tag]")?.dataset.removeTag;
    if (tag) selectTag(tag);
    if (removeTag) {
      state.tags.delete(removeTag);
      syncChecks();
      render();
    }
  });
  elements.search.addEventListener("input", () => { state.query = elements.search.value; render(); });
  elements.sort.addEventListener("change", () => { state.sort = elements.sort.value; render(); });
  elements.reset.addEventListener("click", reset);
  elements.emptyReset.addEventListener("click", reset);
  elements.filterToggle.addEventListener("click", () => {
    elements.filters.classList.add("is-open");
    elements.backdrop.hidden = false;
  });
  elements.drawerClose.addEventListener("click", closeFilters);
  elements.backdrop.addEventListener("click", closeFilters);
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      elements.search.focus();
    }
    if (event.key === "Escape") closeFilters();
  });

  renderFilters();
  restoreState();
  render();
})();
