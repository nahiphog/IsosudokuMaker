import { completedGrid, dig } from "../isosudoku-core.js";

const runs = document.querySelector<HTMLSelectElement>("#runs")!;
const maxGivens = document.querySelector<HTMLSelectElement>("#max-givens")!;
const run = document.querySelector<HTMLButtonElement>("#run")!;
const status = document.querySelector<HTMLParagraphElement>("#status")!;
const summary = document.querySelector<HTMLDivElement>("#summary")!;
const histogram = document.querySelector<HTMLDivElement>("#histogram")!;
const clipboards = document.querySelector<HTMLDivElement>("#clipboards")!;
const clipboardSummary = document.querySelector<HTMLParagraphElement>("#clipboard-summary")!;
const RECENT_CLIPBOARD_LIMIT = 50;

for (const count of [1, 10, 100, 1000, 10000, 100000, 1000000]) {
  const option = document.createElement("option");
  option.value = String(count); option.textContent = count.toLocaleString(); option.selected = count === 1000;
  runs.append(option);
}
for (let count = 3; count <= 30; count += 1) {
  const option = document.createElement("option");
  option.value = String(count); option.textContent = String(count); option.selected = count === 30;
  maxGivens.append(option);
}

function gridString(grid: number[]) { return grid.map((digit) => digit || ".").join(""); }

function drawHistogram(buckets: Map<number, number>) {
  histogram.replaceChildren();
  const maximum = Math.max(...buckets.values(), 1);
  [...buckets.entries()].sort(([left], [right]) => left - right).forEach(([givens, frequency]) => {
    const row = document.createElement("div"); row.className = "histogram-row";
    const label = document.createElement("span"); label.className = "histogram-label"; label.textContent = `${givens} givens`;
    const track = document.createElement("div"); track.className = "histogram-track";
    const bar = document.createElement("div"); bar.className = "histogram-bar"; bar.style.width = `${(frequency / maximum) * 100}%`; bar.textContent = String(frequency);
    track.append(bar); row.append(label, track); histogram.append(row);
  });
}

function addClipboard(runNumber: number, givens: number, grid: number[]) {
  const card = document.createElement("article"); card.className = "clipboard-card";
  const heading = document.createElement("div"); heading.className = "clipboard-heading"; heading.textContent = `Run ${runNumber.toLocaleString()} — ${givens} givens`;
  const value = gridString(grid);
  const field = document.createElement("code"); field.className = "clipboard-value"; field.textContent = value;
  const copy = document.createElement("button"); copy.type = "button"; copy.className = "secondary"; copy.textContent = "Copy";
  copy.addEventListener("click", async () => {
    await navigator.clipboard.writeText(value);
    copy.textContent = "Copied";
    window.setTimeout(() => { copy.textContent = "Copy"; }, 1200);
  });
  card.append(heading, field, copy); clipboards.prepend(card);
  while (clipboards.childElementCount > RECENT_CLIPBOARD_LIMIT) clipboards.lastElementChild?.remove();
}

run.addEventListener("click", () => {
  const total = Number(runs.value);
  const threshold = Number(maxGivens.value);
  const buckets = new Map<number, number>();
  let completed = 0;
  let totalMilliseconds = 0;
  let minimum = Infinity;
  let maximum = -Infinity;
  let matching = 0;
  run.disabled = true; runs.disabled = true; maxGivens.disabled = true; histogram.replaceChildren(); clipboards.replaceChildren(); summary.hidden = false;
  const next = () => {
    const started = performance.now();
    const puzzle = dig(completedGrid());
    const elapsed = performance.now() - started;
    const count = puzzle.filter(Boolean).length;
    completed += 1; totalMilliseconds += elapsed; minimum = Math.min(minimum, count); maximum = Math.max(maximum, count);
    buckets.set(count, (buckets.get(count) ?? 0) + 1); drawHistogram(buckets);
    if (count <= threshold) { matching += 1; addClipboard(completed, count, puzzle); }
    const averageSeconds = totalMilliseconds / completed / 1000;
    summary.textContent = `Final clue count — average ${(Array.from(buckets.entries()).reduce((sum, [givens, frequency]) => sum + givens * frequency, 0) / completed).toFixed(1)}, minimum ${minimum}, maximum ${maximum}. Average generation time: ${averageSeconds.toFixed(2)}s per produced puzzle.`;
    clipboardSummary.textContent = `${matching.toLocaleString()} grid${matching === 1 ? "" : "s"} at or below ${threshold} givens. Showing the newest ${Math.min(matching, RECENT_CLIPBOARD_LIMIT).toLocaleString()} clipboard${Math.min(matching, RECENT_CLIPBOARD_LIMIT) === 1 ? "" : "s"}.`;
    status.textContent = `Run ${completed.toLocaleString()} of ${total.toLocaleString()} completed in ${(elapsed / 1000).toFixed(2)}s; average ${(totalMilliseconds / completed / 1000).toFixed(2)}s.`;
    if (completed < total) window.setTimeout(next, 0);
    else {
      status.textContent = `Simulation complete: ${completed.toLocaleString()} puzzles generated; average ${(totalMilliseconds / completed / 1000).toFixed(2)}s per produced puzzle.`;
      run.disabled = false; runs.disabled = false; maxGivens.disabled = false;
    }
  };
  next();
});
