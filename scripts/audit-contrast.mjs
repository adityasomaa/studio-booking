/**
 * Contrast audit.
 *
 * Reads the OKLCH design tokens out of src/app/globals.css, converts them to
 * sRGB and checks every pair that actually appears in the interface against
 * WCAG AA. Run with: npm run audit:contrast
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "src/app/globals.css"), "utf8");

/* ---------- colour maths ---------- */

function oklchToSrgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const encode = (v) => {
    const clamped = Math.min(1, Math.max(0, v));
    return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  };
  return [encode(lr), encode(lg), encode(lb)];
}

function relativeLuminance([r, g, b]) {
  const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function hex(rgb) {
  return (
    "#" +
    rgb
      .map((v) => Math.round(v * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

/* ---------- token extraction ---------- */

const tokens = {};
const pattern = /--(c-[a-z0-9-]+):\s*oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*\)/g;
let match;
while ((match = pattern.exec(css)) !== null) {
  const [, name, l, c, h] = match;
  const L = Number(l) > 1 ? Number(l) / 100 : Number(l);
  tokens[name] = oklchToSrgb(L, Number(c), Number(h));
}

/* ---------- the pairs the interface actually renders ---------- */

const PAIRS = [
  ["c-ink", "c-paper", 4.5, "teks utama di latar halaman"],
  ["c-ink", "c-paper-2", 4.5, "teks utama di permukaan terangkat"],
  ["c-ink", "c-paper-3", 4.5, "teks utama di permukaan tenggelam"],
  ["c-ink", "c-accent-soft", 4.5, "teks utama di bidang aksen lembut"],
  ["c-ink-2", "c-paper", 4.5, "teks sekunder di latar halaman"],
  ["c-ink-2", "c-paper-2", 4.5, "teks sekunder di permukaan terangkat"],
  ["c-ink-2", "c-paper-3", 4.5, "teks sekunder di permukaan tenggelam"],
  ["c-accent", "c-paper", 4.5, "tautan dan label aksen di latar halaman"],
  ["c-accent", "c-paper-2", 4.5, "tautan aksen di permukaan terangkat"],
  ["c-accent", "c-paper-3", 4.5, "tautan aksen di permukaan tenggelam"],
  ["c-accent-deep", "c-accent-soft", 4.5, "teks aksen di bidang aksen lembut"],
  ["c-on-accent", "c-accent", 4.5, "teks tombol utama"],
  ["c-on-ink", "c-ink", 4.5, "teks tombol gelap"],
  ["c-on-ink-2", "c-ink", 4.5, "teks sekunder di bidang gelap"],
  ["c-accent-on-ink", "c-ink", 4.5, "aksen di bidang gelap"],
  ["c-line-strong", "c-paper", 3.0, "batas kontrol form"],
  ["c-line-on-ink", "c-ink", 1.4, "garis pemisah di bidang gelap"],
];

let failures = 0;
const rows = [];
for (const [fg, bg, min, note] of PAIRS) {
  if (!tokens[fg] || !tokens[bg]) {
    rows.push(["MISSING", fg + " / " + bg, "-", note]);
    failures += 1;
    continue;
  }
  const ratio = contrast(tokens[fg], tokens[bg]);
  const pass = ratio >= min;
  if (!pass) failures += 1;
  rows.push([
    pass ? "pass" : "FAIL",
    fg + " on " + bg,
    ratio.toFixed(2) + " (min " + min.toFixed(1) + ")",
    note,
  ]);
}

const width = Math.max(...rows.map((r) => r[1].length));
console.log("\nToken values");
for (const [name, rgb] of Object.entries(tokens)) {
  console.log("  " + name.padEnd(width) + "  " + hex(rgb));
}
console.log("\nContrast pairs");
for (const [status, pair, ratio, note] of rows) {
  console.log("  " + status.padEnd(7) + pair.padEnd(width) + "  " + ratio.padEnd(18) + note);
}
console.log(
  "\n" + (failures === 0 ? "OK: " + rows.length + " pasangan warna lolos WCAG AA." : failures + " pasangan GAGAL."),
);
process.exit(failures === 0 ? 0 : 1);
