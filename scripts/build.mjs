import { cp, mkdir, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
await rm("dist", { recursive: true, force: true });
await run("npx", ["tsc", "-p", "tsconfig.json"], { shell: process.platform === "win32" });
await mkdir("dist", { recursive: true });
await Promise.all([
  cp("index.html", "dist/index.html"),
  cp("style.css", "dist/style.css"),
]);
