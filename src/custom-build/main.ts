import "../site-header.js";
import { completedGrid, digWithStats, REGIONS } from "../isosudoku-core.js";

const NS = "http://www.w3.org/2000/svg";
const radius = 51, width = Math.sqrt(3) * radius, rowStep = radius * 1.5, startX = 405, startY = 58;
const selected = new Set<number>();
const board = document.querySelector<HTMLDivElement>("#custom-board")!;
const resultBoard = document.querySelector<HTMLDivElement>("#result-board")!;
const result = document.querySelector<HTMLDivElement>("#result")!;
const status = document.querySelector<HTMLParagraphElement>("#status")!;
const completedBoard = document.querySelector<HTMLDivElement>("#completed-board")!;
const walkthrough = document.querySelector<HTMLElement>("#walkthrough")!;
const walkBoard = document.querySelector<HTMLDivElement>("#walk-board")!;
const slider = document.querySelector<HTMLInputElement>("#walk-slider")!;
let builtPuzzle: number[] = [], builtSolution: number[] = [];

function hex(x: number, y: number): string { return Array.from({ length: 6 }, (_, i) => { const a = (60 * i - 30) * Math.PI / 180; return `${(x + radius * Math.cos(a)).toFixed(2)},${(y + radius * Math.sin(a)).toFixed(2)}`; }).join(" "); }
function drawBoundary(svg: SVGSVGElement, vertices: Map<number, { x: number; y: number }[]>, cells: number[], className: string): void { const edges = new Map<string, { a: { x: number; y: number }; b: { x: number; y: number }; count: number }>(); for (const cell of cells) { const points = vertices.get(cell)!; for (let i = 0; i < 6; i += 1) { const a = points[i], b = points[(i + 1) % 6], key = [`${Math.round(a.x * 100)},${Math.round(a.y * 100)}`, `${Math.round(b.x * 100)},${Math.round(b.y * 100)}`].sort().join("|"); const edge = edges.get(key); if (edge) edge.count += 1; else edges.set(key, { a, b, count: 1 }); } } for (const edge of edges.values()) if (edge.count === 1) { const line = document.createElementNS(NS, "line"); line.setAttribute("x1", edge.a.x.toFixed(2)); line.setAttribute("y1", edge.a.y.toFixed(2)); line.setAttribute("x2", edge.b.x.toFixed(2)); line.setAttribute("y2", edge.b.y.toFixed(2)); line.setAttribute("class", className); svg.append(line); } }
function draw(target: HTMLDivElement, values?: number[], interactive = false): void {
  const svg = document.createElementNS(NS, "svg"); svg.setAttribute("viewBox", "0 0 1170 735");
  const vertices = new Map<number, { x: number; y: number }[]>();
  for (let row = 0; row < 9; row += 1) for (let col = 0; col < 9; col += 1) {
    const index = row * 9 + col, x = startX + col * width - row * width / 2, y = startY + row * rowStep;
    vertices.set(index + 1, Array.from({ length: 6 }, (_, i) => { const a = (60 * i - 30) * Math.PI / 180; return { x: x + radius * Math.cos(a), y: y + radius * Math.sin(a) }; }));
    const poly = document.createElementNS(NS, "polygon"); poly.setAttribute("points", hex(x, y)); poly.setAttribute("class", selected.has(index) && interactive ? "build-cell selected-build" : "build-cell");
    if (interactive) poly.addEventListener("click", () => { selected.has(index) ? selected.delete(index) : selected.add(index); draw(board, undefined, true); status.textContent = `${selected.size} protected cell${selected.size === 1 ? "" : "s"} selected.`; });
    svg.append(poly);
    if (values?.[index]) { const text = document.createElementNS(NS, "text"); text.setAttribute("x", x.toFixed(2)); text.setAttribute("y", y.toFixed(2)); text.setAttribute("class", "build-digit"); text.textContent = String(values[index]); svg.append(text); }
  }
  REGIONS.forEach((region) => drawBoundary(svg, vertices, region, "build-region-border"));
  drawBoundary(svg, vertices, Array.from({ length: 81 }, (_, index) => index + 1), "build-figure-border");
  target.replaceChildren(svg);
}
draw(board, undefined, true);
document.querySelector<HTMLButtonElement>("#clear")!.addEventListener("click", () => { selected.clear(); draw(board, undefined, true); status.textContent = "0 protected cells selected."; });
function showWalk(index: number): void { const order = builtPuzzle.map((value, cell) => value ? -1 : cell).filter((cell) => cell >= 0); const values = [...builtPuzzle]; for (let i = 0; i < index; i += 1) values[order[i]] = builtSolution[order[i]]; draw(walkBoard, values); document.querySelector<HTMLParagraphElement>("#walk-description")!.textContent = index ? `Step ${index}: place ${builtSolution[order[index - 1]]} in cell ${order[index - 1] + 1}.` : "Step 0: begin with the built puzzle."; }
slider.addEventListener("input", () => showWalk(Number(slider.value)));
document.querySelector<HTMLButtonElement>("#copy-completed")!.addEventListener("click", async () => { await navigator.clipboard.writeText(builtSolution.join("")); });
document.querySelector<HTMLButtonElement>("#build")!.addEventListener("click", () => {
  const build = document.querySelector<HTMLButtonElement>("#build")!; build.disabled = true; status.textContent = "Building a unique puzzle…";
  requestAnimationFrame(() => { const started = performance.now(); builtSolution = completedGrid(); const built = digWithStats(builtSolution, selected); builtPuzzle = built.puzzle; draw(resultBoard, builtPuzzle); draw(completedBoard, builtSolution); result.hidden = false; const empties = builtPuzzle.filter((value) => !value).length; slider.max = String(empties); slider.value = "0"; walkthrough.hidden = false; showWalk(0); status.textContent = `Built a unique puzzle with ${builtPuzzle.filter(Boolean).length} givens in ${((performance.now() - started) / 1000).toFixed(2)}s after ${built.attempts} removal attempts; all ${selected.size} selected cells were retained.`; build.disabled = false; });
});
