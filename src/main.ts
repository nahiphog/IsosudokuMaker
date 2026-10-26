import "./site-header.js";
import { findHiddenSubset, findLockedCandidates, findNakedSubset, findWWing, findXYWing, findXYZWing } from "./isosudoku-core.js";

const NS = "http://www.w3.org/2000/svg";
const board = document.querySelector<HTMLDivElement>("#board");

if (!board) throw new Error("Board container is missing.");

const svg = document.createElementNS(NS, "svg");
svg.setAttribute("viewBox", "0 0 1170 735");
svg.setAttribute("role", "group");
svg.setAttribute("aria-label", "81 numbered Isosudoku cells");

const radius = 51;
const width = Math.sqrt(3) * radius;
const rowStep = radius * 1.5;
const startX = 405;
const startY = 58;
const regions = [
  [1, 2, 3, 10, 11, 12, 19, 20, 21],
  [4, 5, 6, 13, 14, 15, 22, 23, 24],
  [7, 8, 9, 16, 17, 18, 25, 26, 27],
  [28, 29, 30, 37, 38, 39, 46, 47, 48],
  [31, 32, 33, 40, 41, 42, 49, 50, 51],
  [34, 35, 36, 43, 44, 45, 52, 53, 54],
  [55, 56, 57, 64, 65, 66, 73, 74, 75],
  [58, 59, 60, 67, 68, 69, 76, 77, 78],
  [61, 62, 63, 70, 71, 72, 79, 80, 81],
];
const rows = [
  [1, 10, 19, 28, 37, 46, 55, 64, 73],
  [2, 11, 20, 29, 38, 47, 56, 65, 74],
  [3, 12, 21, 30, 39, 48, 57, 66, 75],
  [4, 13, 22, 31, 40, 49, 58, 67, 76],
  [5, 14, 23, 32, 41, 50, 59, 68, 77],
  [6, 15, 24, 33, 42, 51, 60, 69, 78],
  [7, 16, 25, 34, 43, 52, 61, 70, 79],
  [8, 17, 26, 35, 44, 53, 62, 71, 80],
  [9, 18, 27, 36, 45, 54, 63, 72, 81],
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14, 15, 16, 17, 18],
  [19, 20, 21, 22, 23, 24, 25, 26, 27],
  [28, 29, 30, 31, 32, 33, 34, 35, 36],
  [37, 38, 39, 40, 41, 42, 43, 44, 45],
  [46, 47, 48, 49, 50, 51, 52, 53, 54],
  [55, 56, 57, 58, 59, 60, 61, 62, 63],
  [64, 65, 66, 67, 68, 69, 70, 71, 72],
  [73, 74, 75, 76, 77, 78, 79, 80, 81],
  [46, 56, 66, 76], [37, 47, 57, 67, 77], [28, 38, 48, 58, 68, 78],
  [19, 29, 39, 49, 59, 69, 79], [10, 20, 30, 40, 50, 60, 70, 80],
  [1, 11, 21, 31, 41, 51, 61, 71, 81], [2, 12, 22, 32, 42, 52, 62, 72],
  [3, 13, 23, 33, 43, 53, 63], [4, 14, 24, 34, 44, 54], [5, 15, 25, 35, 45], [6, 16, 26, 36],
];
const constraintUnits = [...regions, ...rows].map((unit) => unit.map((cellNumber) => cellNumber - 1));
const peerCells = Array.from({ length: 81 }, () => new Set<number>());
for (const unit of constraintUnits) {
  for (const cell of unit) for (const peer of unit) if (cell !== peer) peerCells[cell].add(peer);
}
const allCandidates = 0x1ff;

type Point = { x: number; y: number };
const cells = new Map<number, SVGPolygonElement>();
const vertices = new Map<number, Point[]>();
const digitLabels = new Map<number, SVGTextElement>();
const selectedCellNumbers = new Set<number>();
const baseSolution = "123456789895137246467829135374698521958241673216573498732915864641382957589764312".split("").map(Number);

function corners(x: number, y: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return `${(x + radius * Math.cos(angle)).toFixed(2)},${(y + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
}

function hexVertices(x: number, y: number): Point[] {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return { x: x + radius * Math.cos(angle), y: y + radius * Math.sin(angle) };
  });
}

function pointKey(point: Point): string {
  return `${Math.round(point.x * 100)},${Math.round(point.y * 100)}`;
}

function edgeKey(a: Point, b: Point): string {
  return [pointKey(a), pointKey(b)].sort().join("|");
}

function drawBoundary(cellNumbers: number[], className: string): void {
  const edgeCounts = new Map<string, { a: Point; b: Point; count: number }>();
  for (const cellNumber of cellNumbers) {
    const points = vertices.get(cellNumber);
    if (!points) continue;
    for (let i = 0; i < points.length; i += 1) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      const key = edgeKey(a, b);
      const entry = edgeCounts.get(key);
      if (entry) entry.count += 1;
      else edgeCounts.set(key, { a, b, count: 1 });
    }
  }
  for (const { a, b, count } of edgeCounts.values()) {
    if (count !== 1) continue;
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", a.x.toFixed(2));
    line.setAttribute("y1", a.y.toFixed(2));
    line.setAttribute("x2", b.x.toFixed(2));
    line.setAttribute("y2", b.y.toFixed(2));
    line.setAttribute("class", className);
    svg.append(line);
  }
}

for (let row = 0; row < 9; row += 1) {
  for (let col = 0; col < 9; col += 1) {
    const index = row * 9 + col + 1;
    const x = startX + col * width - row * (width / 2);
    const y = startY + row * rowStep;
    vertices.set(index, hexVertices(x, y));
    const polygon = document.createElementNS(NS, "polygon");
    polygon.setAttribute("points", corners(x, y));
    polygon.setAttribute("class", "cell");
    polygon.setAttribute("role", "button");
    polygon.setAttribute("tabindex", "0");
    polygon.setAttribute("aria-label", `Cell ${index}; click to select`);
    polygon.setAttribute("aria-pressed", "false");
    svg.append(polygon);
    cells.set(index, polygon);

    const label = document.createElementNS(NS, "text");
    label.setAttribute("x", x.toFixed(2));
    label.setAttribute("y", y.toFixed(2));
    label.setAttribute("class", "label");
    label.textContent = "";
    svg.append(label);
    digitLabels.set(index, label);
  }
}

for (const region of regions) drawBoundary(region, "region-border");
drawBoundary(Array.from({ length: 81 }, (_, i) => i + 1), "figure-border");

board.append(svg);

const generatorButton = document.querySelector<HTMLButtonElement>("#generate-puzzle");
const diggingMethod = document.querySelector<HTMLSelectElement>("#digging-method");
const generationStatus = document.querySelector<HTMLParagraphElement>("#generation-status");
const gridComparison = document.querySelector<HTMLDivElement>("#grid-comparison");
const dugPanel = document.querySelector<HTMLDivElement>("#dug-panel");
const dugBoard = document.querySelector<HTMLDivElement>("#dug-board");
const walkthrough = document.querySelector<HTMLElement>("#walkthrough");
const walkthroughBoard = document.querySelector<HTMLDivElement>("#walkthrough-board");
const walkthroughDescription = document.querySelector<HTMLParagraphElement>("#walkthrough-description");
const walkthroughSlider = document.querySelector<HTMLInputElement>("#walkthrough-slider");
const walkthroughCounter = document.querySelector<HTMLSpanElement>("#walkthrough-counter");
const difficulty = document.querySelector<HTMLParagraphElement>("#difficulty");
const walkthroughTechniques = document.querySelector<HTMLTableSectionElement>("#walkthrough-techniques");
const walkFirst = document.querySelector<HTMLButtonElement>("#walk-first");
const walkPrev = document.querySelector<HTMLButtonElement>("#walk-prev");
const walkNext = document.querySelector<HTMLButtonElement>("#walk-next");
const walkLast = document.querySelector<HTMLButtonElement>("#walk-last");
let currentCompleted: number[] | null = null;
let currentDug: number[] | null = null;

type WalkthroughStep = { board: number[]; notes: number[][]; removed: Set<string>; kind: string; description: string; placed?: number; eliminations?: Set<string>; sourceCells?: number[]; targetCells?: number[]; highlightedUnits?: number[][]; appliesEliminations?: boolean };
// This is intentionally not wired into the current renderer yet. It gives
// elimination techniques a persistent state without changing existing walks.
type CandidateState = { board: Uint8Array; eliminated: Set<string>; notes: number[][] };
let walkthroughSteps: WalkthroughStep[] = [];
let walkthroughStep = 0;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const swapWith = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [copy[i], copy[swapWith]] = [copy[swapWith], copy[i]];
  }
  return copy;
}

function isValidSolution(values: number[]): boolean {
  return constraintUnits.every((unit) => new Set(unit.map((cell) => values[cell])).size === unit.length);
}

function candidateMask(values: Uint8Array, cell: number): number {
  let used = 0;
  for (const peer of peerCells[cell]) if (values[peer]) used |= 1 << (values[peer] - 1);
  return allCandidates & ~used;
}

function popcount(mask: number): number {
  mask -= (mask >> 1) & 0x55555555;
  mask = (mask & 0x33333333) + ((mask >> 2) & 0x33333333);
  return ((mask + (mask >> 4)) & 0x0f0f0f0f) * 0x01010101 >>> 24;
}

function propagateSingles(values: Uint8Array): boolean {
  let changed = true;
  while (changed) {
    changed = false;
    for (let cell = 0; cell < 81; cell += 1) {
      if (values[cell]) continue;
      const mask = candidateMask(values, cell);
      if (mask === 0) return false;
      if ((mask & (mask - 1)) === 0) {
        values[cell] = 32 - Math.clz32(mask);
        changed = true;
      }
    }
    for (const unit of constraintUnits) {
      let used = 0;
      for (const cell of unit) {
        const value = values[cell];
        if (!value) continue;
        const bit = 1 << (value - 1);
        if (used & bit) return false;
        used |= bit;
      }
      // Only nine-cell units must contain every digit, so hidden singles
      // apply to regions and full-length rows but not to shorter diagonals.
      if (unit.length !== 9) continue;
      for (let digit = 1; digit <= 9; digit += 1) {
        const bit = 1 << (digit - 1);
        if (used & bit) continue;
        let onlyCell = -1;
        for (const cell of unit) {
          if (!values[cell] && candidateMask(values, cell) & bit) {
            if (onlyCell !== -1) { onlyCell = -2; break; }
            onlyCell = cell;
          }
        }
        if (onlyCell === -1) return false;
        if (onlyCell >= 0) {
          values[onlyCell] = digit;
          changed = true;
        }
      }
    }
  }
  return true;
}

function countSolutions(givens: number[], limit = 2): number {
  let found = 0;
  const search = (state: Uint8Array): void => {
    if (found >= limit || !propagateSingles(state)) return;
    let bestCell = -1;
    let bestMask = 0;
    let bestCount = 10;
    for (let cell = 0; cell < 81; cell += 1) {
      if (state[cell]) continue;
      const mask = candidateMask(state, cell);
      const count = popcount(mask);
      if (count < bestCount) {
        bestCell = cell;
        bestMask = mask;
        bestCount = count;
        if (count === 2) break;
      }
    }
    if (bestCell === -1) { found += 1; return; }
    for (let digit = 1; digit <= 9 && found < limit; digit += 1) {
      if (!(bestMask & (1 << (digit - 1)))) continue;
      const next = new Uint8Array(state);
      next[bestCell] = digit;
      search(next);
    }
  };
  search(Uint8Array.from(givens));
  return found;
}

function renderValues(values: number[], givens = values): void {
  for (let cellNumber = 1; cellNumber <= 81; cellNumber += 1) {
    digitLabels.get(cellNumber)!.textContent = values[cellNumber - 1] ? String(values[cellNumber - 1]) : "";
    digitLabels.get(cellNumber)!.style.fill = givens[cellNumber - 1] ? "#161d1a" : "#1769aa";
    const description = values[cellNumber - 1] ? `generated digit ${values[cellNumber - 1]}` : "empty";
    cells.get(cellNumber)?.setAttribute("aria-label", `Cell ${cellNumber}; ${description}; click to select`);
  }
}

function renderDugGrid(values: number[]): void {
  const dugSvg = renderedSvg(values, undefined, values);
  dugSvg.setAttribute("aria-hidden", "true");
  dugBoard?.replaceChildren(dugSvg);
  if (dugPanel) dugPanel.hidden = false;
  gridComparison?.classList.add("generated");
}

function gridString(values: number[]): string {
  return values.map((value) => value || ".").join("");
}

function renderedSvg(values: number[], highlightCell?: number, givens = values, notes?: number[][], removed = new Set<string>()): SVGSVGElement {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute("xmlns", NS);
  copy.setAttribute("width", "1170");
  copy.setAttribute("height", "735");
  copy.querySelectorAll<SVGTextElement>("text").forEach((label, index) => {
    label.textContent = values[index] ? String(values[index]) : "";
    label.style.fill = givens[index] ? "#161d1a" : "#1769aa";
    label.setAttribute("font-size", "26");
    label.setAttribute("font-weight", "800");
  });
  copy.querySelectorAll<SVGPolygonElement>("polygon").forEach((polygon, index) => {
    polygon.setAttribute("fill", index === highlightCell ? "#cce6d9" : "#fefefb");
    polygon.setAttribute("stroke", "#24302e");
    polygon.setAttribute("stroke-width", "1.45");
  });
  copy.querySelectorAll<SVGLineElement>("line").forEach((line) => {
    line.setAttribute("stroke", "#17201e");
  });
  if (notes) {
    notes.forEach((candidates, cell) => {
      if (values[cell]) return;
      const points = vertices.get(cell + 1);
      if (!points) return;
      const center = points.reduce((total, point) => ({ x: total.x + point.x, y: total.y + point.y }), { x: 0, y: 0 });
      center.x /= points.length;
      center.y /= points.length;
      const displayed = new Set(candidates);
      for (let digit = 1; digit <= 9; digit += 1) if (removed.has(`${cell}:${digit}`)) displayed.add(digit);
      for (const digit of displayed) {
        const position = digit - 1;
        const column = position % 3 - 1;
        const row = Math.floor(position / 3) - 1;
        const x = center.x + column * 19;
        const y = center.y + row * 17;
        const crossed = removed.has(`${cell}:${digit}`);
        const candidate = document.createElementNS(NS, "text");
        candidate.setAttribute("x", x.toFixed(2));
        candidate.setAttribute("y", y.toFixed(2));
        candidate.setAttribute("fill", crossed ? "#bf3131" : "#1769aa");
        candidate.setAttribute("font-size", "12");
        candidate.setAttribute("font-weight", "700");
        candidate.setAttribute("text-anchor", "middle");
        candidate.setAttribute("dominant-baseline", "central");
        candidate.textContent = String(digit);
        copy.append(candidate);
        if (crossed) {
          const strike = document.createElementNS(NS, "line");
          strike.setAttribute("x1", (x - 5).toFixed(2)); strike.setAttribute("x2", (x + 5).toFixed(2));
          strike.setAttribute("y1", y.toFixed(2)); strike.setAttribute("y2", y.toFixed(2));
          strike.setAttribute("stroke", "#bf3131"); strike.setAttribute("stroke-width", "1.7");
          copy.append(strike);
        }
      }
    });
  }
  return copy;
}

async function copyGridImage(values: number[], givens = values): Promise<void> {
  if (!navigator.clipboard || !window.ClipboardItem) throw new Error("Image clipboard is unavailable.");
  const image = new Image();
  const svgMarkup = new XMLSerializer().serializeToString(renderedSvg(values, undefined, givens));
  const objectUrl = URL.createObjectURL(new Blob([svgMarkup], { type: "image/svg+xml" }));
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Grid image could not be rendered."));
      image.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 1170;
    canvas.height = 735;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable.");
    context.fillStyle = "#fefefb";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Grid image could not be encoded.");
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function findWalkthroughMove(state: Uint8Array, solution: number[]): { cell: number; value: number; kind: string } | null {
  for (let cell = 0; cell < 81; cell += 1) {
    if (!state[cell] && popcount(candidateMask(state, cell)) === 1) {
      return { cell, value: solution[cell], kind: "Naked Single" };
    }
  }
  for (const unit of constraintUnits) {
    if (unit.length !== 9) continue;
    for (let digit = 1; digit <= 9; digit += 1) {
      const bit = 1 << (digit - 1);
      if (unit.some((cell) => state[cell] === digit)) continue;
      const matches = unit.filter((cell) => !state[cell] && candidateMask(state, cell) & bit);
      if (matches.length === 1) return { cell: matches[0], value: digit, kind: "Hidden Single" };
    }
  }
  let bestCell = -1;
  let bestCandidates = 10;
  for (let cell = 0; cell < 81; cell += 1) {
    if (state[cell]) continue;
    const count = popcount(candidateMask(state, cell));
    if (count < bestCandidates) { bestCell = cell; bestCandidates = count; }
  }
  return bestCell === -1 ? null : { cell: bestCell, value: solution[bestCell], kind: "Backtracking" };
}

function candidateNotes(state: Uint8Array, eliminated = new Set<string>()): number[][] {
  return Array.from({ length: 81 }, (_, cell) => {
    if (state[cell]) return [];
    const mask = candidateMask(state, cell);
    return Array.from({ length: 9 }, (_, index) => index + 1).filter((digit) => mask & (1 << (digit - 1)) && !eliminated.has(`${cell}:${digit}`));
  });
}

function createCandidateState(board: number[]): CandidateState {
  const state = Uint8Array.from(board);
  return { board: state, eliminated: new Set<string>(), notes: candidateNotes(state) };
}

function appendEliminationFrames(steps: WalkthroughStep[], candidateState: CandidateState, kind: string, eliminations: Set<string>, description: string, sourceCells: number[] = [], targetCells: number[] = []): void {
  const pending = new Set([...eliminations].filter((item) => !candidateState.eliminated.has(item)));
  if (!pending.size) return;
  steps.push({ board: [...candidateState.board], notes: candidateState.notes, removed: pending, eliminations: pending, sourceCells, targetCells, kind, description, appliesEliminations: false });
  pending.forEach((item) => candidateState.eliminated.add(item));
  candidateState.notes = candidateNotes(candidateState.board, candidateState.eliminated);
  steps.push({ board: [...candidateState.board], notes: candidateState.notes, removed: new Set(), eliminations: new Set(), sourceCells, targetCells, kind, description: `${kind}: the crossed-out Snyder candidates are now removed.`, appliesEliminations: true });
}

function removedNotes(before: number[][], after: number[][], state: Uint8Array): Set<string> {
  const removed = new Set<string>();
  for (let cell = 0; cell < 81; cell += 1) {
    if (state[cell]) continue;
    for (const digit of before[cell]) if (!after[cell].includes(digit)) removed.add(`${cell}:${digit}`);
  }
  return removed;
}

function buildWalkthrough(puzzle: number[], solution: number[]): WalkthroughStep[] {
  const candidateState = createCandidateState(puzzle);
  const state = candidateState.board;
  let notes = candidateState.notes;
  const steps: WalkthroughStep[] = [{ board: [...state], notes, removed: new Set(), kind: "Snyder notation", description: "Step 0: Snyder notation is added in blue to every empty cell." }];
  while (state.some((value) => value === 0)) {
    const deduction = [findLockedCandidates([...state]), findNakedSubset([...state]), findHiddenSubset([...state]), findXYWing([...state]), findXYZWing([...state]), findWWing([...state])].find((item) => item?.eliminations.some(({ cell, digit }) => !candidateState.eliminated.has(`${cell}:${digit}`)));
    const pendingEliminations = new Set((deduction?.eliminations ?? []).map(({ cell, digit }) => `${cell}:${digit}`).filter((item) => !candidateState.eliminated.has(item)));
    if (deduction && pendingEliminations.size) {
      appendEliminationFrames(steps, candidateState, deduction.technique, pendingEliminations, deduction.explanation, deduction.sourceCells, deduction.targetCells);
      notes = candidateState.notes;
      continue;
    }
    const move = findWalkthroughMove(state, solution);
    if (!move) throw new Error("Unable to construct a walkthrough.");
    const before = notes;
    state[move.cell] = move.value;
    notes = candidateNotes(state);
    const removed = removedNotes(before, notes, state);
    const cellName = move.cell + 1;
    const removals = removed.size ? ` ${removed.size} neighbouring Snyder notation${removed.size === 1 ? " is" : "s are"} crossed out in red.` : " No neighbouring Snyder notations are removed in this step.";
    const description = move.kind === "Backtracking"
      ? `Backtracking: test the verified solution digit ${move.value} in cell ${cellName} after the available logical singles are exhausted.${removals}`
      : `${move.kind}: place ${move.value} in cell ${cellName}.${removals}`;
    steps.push({ board: [...state], notes, removed, kind: move.kind, description, placed: move.cell });
  }
  return steps;
}

function showWalkthroughStep(index: number): void {
  if (!walkthroughSteps.length) return;
  walkthroughStep = Math.max(0, Math.min(index, walkthroughSteps.length - 1));
  const step = walkthroughSteps[walkthroughStep];
  const givens = walkthroughSteps[0].board;
  walkthroughBoard?.replaceChildren(renderedSvg(step.board, step.placed, givens, step.notes, step.removed));
  if (walkthroughDescription) walkthroughDescription.textContent = step.description;
  if (walkthroughSlider) walkthroughSlider.value = String(walkthroughStep);
  if (walkthroughCounter) walkthroughCounter.textContent = `Step ${walkthroughStep} of ${walkthroughSteps.length - 1}`;
}

function showWalkthrough(puzzle: number[], solution: number[]): void {
  walkthroughSteps = buildWalkthrough(puzzle, solution);
  const techniques = new Set(walkthroughSteps.map((step) => step.kind));
  const backtrackingSteps = walkthroughSteps.filter((step) => step.kind === "Backtracking").length;
  const rating = walkthroughSteps.reduce((total, step) => total + (step.kind === "Naked Single" ? 10 : step.kind === "Hidden Single" ? 20 : step.kind === "Backtracking" ? 1000 : 0), 0);
  const level = backtrackingSteps ? "Expert" : rating <= 300 ? "Beginner" : "Intermediate";
  if (difficulty) difficulty.textContent = `Difficulty: ${level} · Rating: ${rating} · ${walkthroughSteps.length - 1} moves · ${[...techniques].join(", ")}`;
  if (walkthroughTechniques) {
    const grouped = new Map<string, number[]>();
    walkthroughSteps.forEach((step, index) => {
      const indices = grouped.get(step.kind) ?? [];
      indices.push(index);
      grouped.set(step.kind, indices);
    });
    walkthroughTechniques.replaceChildren(...[...grouped.entries()].map(([technique, steps]) => {
      const row = document.createElement("tr");
      const techniqueCell = document.createElement("td");
      const stepsCell = document.createElement("td");
      techniqueCell.textContent = technique;
      stepsCell.textContent = steps.join(", ");
      row.append(techniqueCell, stepsCell);
      return row;
    }));
  }
  if (walkthroughSlider) walkthroughSlider.max = String(walkthroughSteps.length - 1);
  if (walkthrough) walkthrough.hidden = false;
  showWalkthroughStep(0);
}

function digPuzzle(completed: number[], method: "single" | "dual"): number[] {
  const dug = [...completed];
  const removalGroups = method === "dual"
    ? Array.from({ length: 40 }, (_, index) => [index, 80 - index])
    : Array.from({ length: 81 }, (_, index) => [index]);
  for (const group of shuffle(removalGroups)) {
    const previous = group.map((cell) => dug[cell]);
    for (const cell of group) dug[cell] = 0;
    if (countSolutions(dug) !== 1) {
      group.forEach((cell, index) => { dug[cell] = previous[index]; });
    }
  }
  return dug;
}

function generatePuzzle(): void {
  const startedAt = performance.now();
  const permutation = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const completed = baseSolution.map((digit) => permutation[digit - 1]);
  if (!isValidSolution(completed)) throw new Error("Generated board did not meet Isosudoku constraints.");
  const method = diggingMethod?.value === "dual" ? "dual" : "single";
  const dug = digPuzzle(completed, method);
  renderValues(completed, dug);
  renderDugGrid(dug);
  currentCompleted = completed;
  currentDug = dug;
  showWalkthrough(dug, completed);
  const elapsed = performance.now() - startedAt;
  const givens = dug.filter(Boolean).length;
  if (generationStatus) generationStatus.textContent = `Completed grid and ${method === "dual" ? "dual-cell" : "single-cell"} dug grid generated in ${elapsed < 1 ? "< 1 ms" : `${elapsed.toFixed(1)} ms`}. Dug puzzle: ${givens} cells.`;
}

generatorButton?.addEventListener("click", () => {
  generatorButton.disabled = true;
  if (diggingMethod) diggingMethod.disabled = true;
  generatorButton.textContent = "Generating…";
  requestAnimationFrame(() => {
    try { generatePuzzle(); }
    finally {
      generatorButton.disabled = false;
      if (diggingMethod) diggingMethod.disabled = false;
      generatorButton.textContent = "Generate";
    }
  });
});

walkthroughSlider?.addEventListener("input", () => showWalkthroughStep(Number(walkthroughSlider.value)));
walkFirst?.addEventListener("click", () => showWalkthroughStep(0));
walkPrev?.addEventListener("click", () => showWalkthroughStep(walkthroughStep - 1));
walkNext?.addEventListener("click", () => showWalkthroughStep(walkthroughStep + 1));
walkLast?.addEventListener("click", () => showWalkthroughStep(walkthroughSteps.length - 1));

document.querySelectorAll<HTMLButtonElement>("[data-copy-grid]").forEach((button) => {
  button.addEventListener("click", async () => {
    const values = button.dataset.copyGrid === "dug" ? currentDug : currentCompleted;
    if (!values) return;
    try {
      const givens = button.dataset.copyGrid === "dug" ? values : currentDug ?? values;
      if (button.dataset.copyFormat === "image") await copyGridImage(values, givens);
      else await navigator.clipboard.writeText(gridString(values));
      if (generationStatus) generationStatus.textContent = `${button.dataset.copyGrid === "dug" ? "Dug puzzle" : "Completed grid"} copied as ${button.dataset.copyFormat === "image" ? "an image" : "a string"}.`;
    } catch {
      if (generationStatus) generationStatus.textContent = "Clipboard access was unavailable. Please try again in a supported browser.";
    }
  });
});

const selectedCellsReadout = document.querySelector<HTMLParagraphElement>("#selected-cells");
const clearCellSelection = document.querySelector<HTMLButtonElement>("#clear-cell-selection");

function updateCellSelection(): void {
  const selections = [...selectedCellNumbers].sort((a, b) => a - b);
  if (selectedCellsReadout) {
    selectedCellsReadout.textContent = selections.length === 0
      ? "No cells selected."
      : `Selected cells (${selections.length}): ${selections.join(", ")}`;
  }
  if (clearCellSelection) clearCellSelection.disabled = selections.length === 0;
}

function toggleCellSelection(cellNumber: number): void {
  const polygon = cells.get(cellNumber);
  if (!polygon) return;
  if (selectedCellNumbers.has(cellNumber)) selectedCellNumbers.delete(cellNumber);
  else selectedCellNumbers.add(cellNumber);
  polygon.classList.toggle("selected", selectedCellNumbers.has(cellNumber));
  polygon.setAttribute("aria-pressed", String(selectedCellNumbers.has(cellNumber)));
  updateCellSelection();
}

for (const [cellNumber, polygon] of cells) {
  polygon.addEventListener("click", () => toggleCellSelection(cellNumber));
  polygon.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleCellSelection(cellNumber);
    }
  });
}

clearCellSelection?.addEventListener("click", () => {
  for (const cellNumber of selectedCellNumbers) {
    const polygon = cells.get(cellNumber);
    polygon?.classList.remove("selected");
    polygon?.setAttribute("aria-pressed", "false");
  }
  selectedCellNumbers.clear();
  updateCellSelection();
});

const toggle = document.querySelector<HTMLButtonElement>("#toggle-region-picker");
const picker = document.querySelector<HTMLDivElement>("#region-picker");
const regionOptions = document.querySelector<HTMLDivElement>(".region-options");
const rowOptions = document.querySelector<HTMLDivElement>(".row-options");
const clear = document.querySelector<HTMLButtonElement>("#clear-region");

function selectHighlight(kind: "region" | "row" | null, index: number | null): void {
  const highlightedCells = kind === "region" && index !== null ? regions[index]
    : kind === "row" && index !== null ? rows[index]
    : [];
  for (const [cellNumber, polygon] of cells) {
    polygon.classList.toggle("highlighted", highlightedCells.includes(cellNumber));
  }
  document.querySelectorAll<HTMLButtonElement>("[data-highlight-kind]").forEach((button) => {
    button.setAttribute("aria-pressed", String(kind === button.dataset.highlightKind && index !== null && Number(button.dataset.highlightIndex) === index));
  });
}

for (let i = 0; i < regions.length; i += 1) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = String(i + 1);
  button.dataset.highlightKind = "region";
  button.dataset.highlightIndex = String(i);
  button.setAttribute("aria-label", `Highlight region ${i + 1}`);
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => selectHighlight("region", i));
  regionOptions?.append(button);
}

for (let i = 0; i < rows.length; i += 1) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = String(i + 1);
  button.dataset.highlightKind = "row";
  button.dataset.highlightIndex = String(i);
  button.setAttribute("aria-label", `Highlight row ${i + 1}`);
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => selectHighlight("row", i));
  rowOptions?.append(button);
}

toggle?.addEventListener("click", () => {
  const isHidden = picker?.hidden ?? true;
  if (picker) picker.hidden = !isHidden;
  toggle.setAttribute("aria-expanded", String(isHidden));
  toggle.textContent = isHidden ? "Hide row / region picker" : "Highlight a row / region";
});

clear?.addEventListener("click", () => selectHighlight(null, null));
