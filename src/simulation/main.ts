import { completedGrid, dig } from "../isosudoku-core.js";

const runs = document.querySelector<HTMLSelectElement>("#runs")!;
const run = document.querySelector<HTMLButtonElement>("#run")!;
const status = document.querySelector<HTMLParagraphElement>("#status")!;
const summary = document.querySelector<HTMLDivElement>("#summary")!;
const table = document.querySelector<HTMLTableElement>(".results-table")!;
const results = document.querySelector<HTMLTableSectionElement>("#results")!;

run.addEventListener("click", () => {
  const total = Number(runs.value);
  const counts: number[] = [];
  run.disabled = true; runs.disabled = true; results.replaceChildren(); table.hidden = false; summary.hidden = true;
  const next = () => {
    const started = performance.now();
    const puzzle = dig(completedGrid());
    const count = puzzle.filter(Boolean).length;
    counts.push(count);
    const row = document.createElement("tr");
    row.innerHTML = `<td>${counts.length}</td><td>${count}</td>`;
    results.append(row);
    status.textContent = `Run ${counts.length} of ${total} completed in ${((performance.now() - started) / 1000).toFixed(2)}s.`;
    if (counts.length < total) window.setTimeout(next, 0);
    else {
      const min = Math.min(...counts), max = Math.max(...counts), average = counts.reduce((sum, value) => sum + value, 0) / counts.length;
      summary.textContent = `Final clue count — average ${average.toFixed(1)}, minimum ${min}, maximum ${max}.`;
      summary.hidden = false; run.disabled = false; runs.disabled = false;
    }
  };
  next();
});
