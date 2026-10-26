import "../site-header.js";
import { TECHNIQUE_CATALOG } from "../isosudoku-core.js";

const body = document.querySelector<HTMLTableSectionElement>("#technique-list");
if (body) body.replaceChildren(...TECHNIQUE_CATALOG.map((technique) => { const row = document.createElement("tr"), name = document.createElement("td"), state = document.createElement("td"); name.textContent = technique; state.textContent = technique === "Snyder notation" ? "Walkthrough notation" : technique === "Backtracking" ? "Solver fallback" : "Solver detector implemented"; row.append(name, state); return row; }));
