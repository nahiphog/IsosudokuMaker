import { cp, mkdir, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
await rm("dist", { recursive: true, force: true });
await run("npx", ["tsc", "-p", "tsconfig.json"], { shell: process.platform === "win32" });
await mkdir("dist", { recursive: true });
await Promise.all([mkdir("dist/simulation", { recursive: true }), mkdir("dist/custom-build", { recursive: true })]);
await Promise.all([
  cp("index.html", "dist/index.html"),
  cp("style.css", "dist/style.css"),
  cp("LICENSE", "dist/LICENSE"),
  cp("THIRD_PARTY_NOTICES.md", "dist/THIRD_PARTY_NOTICES.md"),
  cp("simulation/index.html", "dist/simulation/index.html", { recursive: true }),
  cp("custom-build/index.html", "dist/custom-build/index.html", { recursive: true }),
]);
