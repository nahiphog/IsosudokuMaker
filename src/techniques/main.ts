import "../site-header.js";
import { TECHNIQUE_REGISTRY } from "../isosudoku-core.js";

const body = document.querySelector<HTMLTableSectionElement>(".results-table tbody");
if (body) body.replaceChildren(...TECHNIQUE_REGISTRY.map((technique) => { const row = document.createElement("tr"), name = document.createElement("td"), state = document.createElement("td"); name.textContent = technique.name; state.textContent = technique.active ? "Active in walkthrough" : technique.implemented ? "Detector implemented — walkthrough integration pending" : "Planned"; row.append(name, state); return row; }));
