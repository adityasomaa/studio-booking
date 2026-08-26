/**
 * Layer audit.
 *
 * There is exactly one z-index scale, declared in globals.css, and everything
 * that needs to stack reaches it through a .layer-* utility. This script fails
 * the build if a raw z-index creeps back in: a literal `z-index: 40`, a Tailwind
 * `z-50`, or an arbitrary `z-[999]`.
 *
 * Run with: npm run audit:layers
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SEARCH_DIRS = ["src"];
const EXTENSIONS = new Set([".ts", ".tsx", ".css", ".js", ".jsx"]);

/** The one file allowed to say `z-index`, and only inside .layer-* rules. */
const TOKEN_FILE = "src/app/globals.css";

const offenders = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!EXTENSIONS.has(extname(full))) continue;
    inspect(full);
  }
}

function inspect(file) {
  const rel = relative(root, file).split("\\").join("/");
  const lines = readFileSync(file, "utf8").split(/\r?\n/);

  lines.forEach((line, index) => {
    const report = (why) =>
      offenders.push({ file: rel, line: index + 1, why, text: line.trim() });

    // Tailwind numeric z utilities: z-10, z-50, -z-10
    if (/(^|["'\s`])-?z-(\d+|auto)(?=$|["'\s`])/.test(line)) {
      report("utilitas z-index mentah dari Tailwind");
    }
    // Arbitrary Tailwind values: z-[999]
    if (/z-\[[^\]]*\]/.test(line) && !/z-\[var\(--z-/.test(line)) {
      report("nilai z-index arbitrer");
    }
    // Raw CSS or inline style
    if (/z-?[Ii]ndex\s*[:=]/.test(line)) {
      const usesToken = /var\(--z-/.test(line);
      const isTokenFile = rel === TOKEN_FILE;
      if (!usesToken && !isTokenFile) report("z-index literal");
    }
  });
}

for (const dir of SEARCH_DIRS) walk(join(root, dir));

if (offenders.length === 0) {
  console.log("OK: tidak ada z-index mentah. Semua lapisan memakai skala --z-* di globals.css.");
  process.exit(0);
}

console.error("Ditemukan " + offenders.length + " z-index mentah:");
for (const offender of offenders) {
  console.error("  " + offender.file + ":" + offender.line + "  " + offender.why);
  console.error("      " + offender.text);
}
process.exit(1);
