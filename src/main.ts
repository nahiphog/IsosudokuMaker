const NS = "http://www.w3.org/2000/svg";
const board = document.querySelector<HTMLDivElement>("#board");

if (!board) throw new Error("Board container is missing.");

const svg = document.createElementNS(NS, "svg");
svg.setAttribute("viewBox", "0 0 1170 735");
svg.setAttribute("aria-hidden", "true");

const radius = 51;
const width = Math.sqrt(3) * radius;
const rowStep = radius * 1.5;
const startX = 405;
const startY = 58;

function corners(x: number, y: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return `${(x + radius * Math.cos(angle)).toFixed(2)},${(y + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
}

function hasRegionEdge(row: number, col: number): boolean {
  // The nine outlined 3 × 3 rhombi form the marked areas.
  return row % 3 === 0 || col % 3 === 0 || row === 8 || col === 8;
}

for (let row = 0; row < 9; row += 1) {
  for (let col = 0; col < 9; col += 1) {
    const index = row * 9 + col + 1;
    const x = startX + col * width - row * (width / 2);
    const y = startY + row * rowStep;
    const polygon = document.createElementNS(NS, "polygon");
    polygon.setAttribute("points", corners(x, y));
    polygon.setAttribute("class", `cell${hasRegionEdge(row, col) ? " region-edge" : ""}`);
    svg.append(polygon);

    const label = document.createElementNS(NS, "text");
    label.setAttribute("x", x.toFixed(2));
    label.setAttribute("y", y.toFixed(2));
    label.setAttribute("class", "label");
    label.textContent = String(index);
    svg.append(label);
  }
}

board.append(svg);
