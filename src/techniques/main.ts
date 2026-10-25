import "../site-header.js";

document.querySelectorAll<HTMLTableRowElement>("tr").forEach((row) => {
  if (row.textContent?.includes("Single placement")) row.remove();
});
