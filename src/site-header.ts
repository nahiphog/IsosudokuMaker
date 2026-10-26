const dialog = document.querySelector<HTMLDialogElement>("#about-dialog");
const openAbout = document.querySelector<HTMLButtonElement>("[data-open-about]");
const closeAbout = document.querySelector<HTMLButtonElement>("[data-close-about]");
const description = document.querySelector<HTMLButtonElement>("#puzzle-description");
const copyStatus = document.querySelector<HTMLParagraphElement>("#about-copy-status");

async function copyDescription(): Promise<void> {
  if (!description) return;
  const text = description.textContent?.trim() ?? "";
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  if (copyStatus) copyStatus.textContent = "Puzzle description copied to the clipboard.";
}

openAbout?.addEventListener("click", () => dialog?.showModal());
closeAbout?.addEventListener("click", () => dialog?.close());
description?.addEventListener("click", () => { void copyDescription(); });
dialog?.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

const nav = document.querySelector<HTMLElement>(".site-nav");
const pages = [
  ["Generate", "../"], ["Simulation", "../simulation/"], ["Custom Build", "../custom-build/"], ["Verify", "../verify/"], ["Techniques", "../techniques/"],
] as const;
if (nav) {
  const isRoot = location.pathname === "/" || location.pathname.endsWith("/index.html");
  nav.replaceChildren(...pages.map(([label, href]) => {
    const link = document.createElement("a");
    link.textContent = label;
    link.href = isRoot ? href.replace(/^\.\.\//, "./") : href;
    const active = location.pathname.includes(label === "Generate" ? "__root__" : label === "Custom Build" ? "custom-build" : label.toLowerCase());
    if ((label === "Generate" && isRoot) || active) link.classList.add("active");
    return link;
  }));
}
