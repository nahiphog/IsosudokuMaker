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

type Point = { x: number; y: number };
const cells = new Map<number, SVGPolygonElement>();
const vertices = new Map<number, Point[]>();
const selectedCellNumbers = new Set<number>();

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
    label.textContent = String(index);
    svg.append(label);
  }
}

for (const region of regions) drawBoundary(region, "region-border");
drawBoundary(Array.from({ length: 81 }, (_, i) => i + 1), "figure-border");

board.append(svg);

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
