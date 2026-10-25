import { completedGrid, dig } from "../isosudoku-core.js";

const NS = "http://www.w3.org/2000/svg";
const radius = 51, width = Math.sqrt(3) * radius, rowStep = radius * 1.5, startX = 405, startY = 58;
const selected = new Set<number>();
const board = document.querySelector<HTMLDivElement>("#custom-board")!;
const resultBoard = document.querySelector<HTMLDivElement>("#result-board")!;
const result = document.querySelector<HTMLDivElement>("#result")!;
const status = document.querySelector<HTMLParagraphElement>("#status")!;

function hex(x: number, y: number): string { return Array.from({ length: 6 }, (_, i) => { const a = (60 * i - 30) * Math.PI / 180; return `${(x + radius * Math.cos(a)).toFixed(2)},${(y + radius * Math.sin(a)).toFixed(2)}`; }).join(" "); }
function draw(target: HTMLDivElement, values?: number[], interactive = false): void {
  const svg = document.createElementNS(NS, "svg"); svg.setAttribute("viewBox", "0 0 1170 735");
  for (let row = 0; row < 9; row += 1) for (let col = 0; col < 9; col += 1) {
    const index = row * 9 + col, x = startX + col * width - row * width / 2, y = startY + row * rowStep;
    const poly = document.createElementNS(NS, "polygon"); poly.setAttribute("points", hex(x, y)); poly.setAttribute("class", selected.has(index) && interactive ? "build-cell selected-build" : "build-cell");
    if (interactive) poly.addEventListener("click", () => { selected.has(index) ? selected.delete(index) : selected.add(index); draw(board, undefined, true); status.textContent = `${selected.size} protected cell${selected.size === 1 ? "" : "s"} selected.`; });
    svg.append(poly);
    if (values?.[index]) { const text = document.createElementNS(NS, "text"); text.setAttribute("x", x.toFixed(2)); text.setAttribute("y", y.toFixed(2)); text.setAttribute("class", "build-digit"); text.textContent = String(values[index]); svg.append(text); }
  }
  target.replaceChildren(svg);
}
draw(board, undefined, true);
document.querySelector<HTMLButtonElement>("#clear")!.addEventListener("click", () => { selected.clear(); draw(board, undefined, true); status.textContent = "0 protected cells selected."; });
document.querySelector<HTMLButtonElement>("#build")!.addEventListener("click", () => {
  const build = document.querySelector<HTMLButtonElement>("#build")!; build.disabled = true; status.textContent = "Building a unique puzzle…";
  requestAnimationFrame(() => { const started = performance.now(); const solved = completedGrid(); const puzzle = dig(solved, selected); draw(resultBoard, puzzle); result.hidden = false; status.textContent = `Built a unique puzzle with ${puzzle.filter(Boolean).length} givens in ${((performance.now() - started) / 1000).toFixed(2)}s; all ${selected.size} selected cells were retained.`; build.disabled = false; });
});
