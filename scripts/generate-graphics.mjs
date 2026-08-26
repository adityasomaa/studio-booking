/**
 * Placeholder graphics generator.
 *
 * Every image on this site is drawn here, deterministically, from the design
 * tokens in globals.css. Nothing is stock, nothing is fetched, and nothing
 * pretends to be a photograph or shows a face: using another studio's work as
 * filler is a real problem in this industry.
 *
 * The visual family is planes, light and frames. Soft gradients and thin rules
 * carry the depth. There is deliberately no grain, no noise and no speckle
 * anywhere in the output.
 *
 * Re-run any time with: npm run graphics
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "graphics");

/* ---------- tokens, read straight from the stylesheet ---------- */

function oklchToHex(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => {
    const c = Math.min(1, Math.max(0, v));
    const encoded = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
    return Math.round(encoded * 255);
  });
  return "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
}

const css = readFileSync(join(root, "src/app/globals.css"), "utf8");
const palette = {};
const tokenPattern = /--(c-[a-z0-9-]+):\s*oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*\)/g;
let m;
while ((m = tokenPattern.exec(css)) !== null) {
  const L = Number(m[2]) > 1 ? Number(m[2]) / 100 : Number(m[2]);
  palette[m[1]] = oklchToHex(L, Number(m[3]), Number(m[4]));
}

const PAPER = palette["c-paper"];
const PAPER_2 = palette["c-paper-2"];
const PAPER_3 = palette["c-paper-3"];
const LINE = palette["c-line"];
const INK = palette["c-ink"];
const ACCENT = palette["c-accent"];
const ACCENT_SOFT = palette["c-accent-soft"];

/* ---------- deterministic randomness ---------- */

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let a = hash(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (n) => Math.round(n * 100) / 100;

/* ---------- drawing ---------- */

/**
 * One composition: a lit ground, two or three overlapping planes, and a frame
 * that crops them. Accent appears once at most.
 */
function compose(seed, width, height, options = {}) {
  const rand = rng(seed);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const between = (min, max) => min + rand() * (max - min);

  const uid = hash(seed).toString(36);
  const accentChance = options.accentChance ?? 0.65;
  const useAccent = rand() < accentChance;
  const short = Math.min(width, height);
  const pad = short * between(0.075, 0.105);

  const defs = [];
  const body = [];

  /* ground */
  defs.push(
    '<linearGradient id="g' +
      uid +
      'a" x1="0" y1="0" x2="0.35" y2="1">' +
      '<stop offset="0" stop-color="' +
      PAPER +
      '"/>' +
      '<stop offset="1" stop-color="' +
      PAPER_2 +
      '"/>' +
      "</linearGradient>",
  );
  body.push('<rect width="' + width + '" height="' + height + '" fill="url(#g' + uid + 'a)"/>');

  /* light: one broad wash, one soft pool. Gradient only, never speckle. */
  const lightX = between(0.2, 0.8) * width;
  const lightY = between(0.12, 0.5) * height;
  const lightR = short * between(0.55, 0.95);
  defs.push(
    '<radialGradient id="g' +
      uid +
      'b" cx="0.5" cy="0.5" r="0.5">' +
      '<stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/>' +
      '<stop offset="0.55" stop-color="#ffffff" stop-opacity="0.34"/>' +
      '<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>' +
      "</radialGradient>",
  );
  body.push(
    '<circle cx="' +
      r2(lightX) +
      '" cy="' +
      r2(lightY) +
      '" r="' +
      r2(lightR) +
      '" fill="url(#g' +
      uid +
      'b)"/>',
  );

  /* planes */
  const layouts = ["column", "band", "corner", "stack"];
  const layout = options.layout ?? pick(layouts);
  const planes = [];

  if (layout === "column") {
    const count = 2 + Math.floor(rand() * 2);
    const inner = width - pad * 2;
    const gap = inner * 0.035;
    const unit = (inner - gap * (count - 1)) / count;
    for (let i = 0; i < count; i += 1) {
      const h = height * between(0.42, 0.82);
      planes.push({
        x: pad + i * (unit + gap),
        y: height - pad - h,
        w: unit,
        h,
      });
    }
  } else if (layout === "band") {
    const bandH = height * between(0.24, 0.36);
    planes.push({ x: pad, y: height * between(0.16, 0.3), w: width - pad * 2, h: bandH });
    planes.push({
      x: pad + (width - pad * 2) * between(0.08, 0.32),
      y: height * between(0.52, 0.62),
      w: (width - pad * 2) * between(0.4, 0.66),
      h: height * between(0.2, 0.3),
    });
  } else if (layout === "corner") {
    planes.push({
      x: pad,
      y: pad,
      w: (width - pad * 2) * between(0.48, 0.68),
      h: (height - pad * 2) * between(0.5, 0.72),
    });
    planes.push({
      x: pad + (width - pad * 2) * between(0.34, 0.46),
      y: pad + (height - pad * 2) * between(0.36, 0.5),
      w: (width - pad * 2) * between(0.42, 0.6),
      h: (height - pad * 2) * between(0.38, 0.55),
    });
  } else {
    const count = 3;
    for (let i = 0; i < count; i += 1) {
      const shrink = 1 - i * 0.16;
      const w = (width - pad * 2) * shrink;
      const h = (height - pad * 2) * shrink;
      planes.push({
        x: pad + (width - pad * 2 - w) * between(0.1, 0.9),
        y: pad + (height - pad * 2 - h) * between(0.1, 0.9),
        w,
        h,
      });
    }
  }

  const fills = [PAPER_3, LINE, PAPER_2];
  const accentIndex = useAccent ? Math.floor(rand() * planes.length) : -1;

  planes.forEach((plane, index) => {
    const isAccent = index === accentIndex;
    const fill = isAccent ? ACCENT_SOFT : fills[index % fills.length];
    const opacity = isAccent ? 1 : r2(between(0.7, 1));
    const radius = r2(short * between(0.01, 0.05));
    body.push(
      '<rect x="' +
        r2(plane.x) +
        '" y="' +
        r2(plane.y) +
        '" width="' +
        r2(plane.w) +
        '" height="' +
        r2(plane.h) +
        '" rx="' +
        radius +
        '" fill="' +
        fill +
        '" opacity="' +
        opacity +
        '"/>',
    );
  });

  /* one accent rule: a beam of light landing across the planes */
  if (useAccent) {
    const beamY = height * between(0.3, 0.78);
    const beamX = pad + (width - pad * 2) * between(0, 0.35);
    const beamW = (width - pad * 2) * between(0.32, 0.7);
    body.push(
      '<rect x="' +
        r2(beamX) +
        '" y="' +
        r2(beamY) +
        '" width="' +
        r2(beamW) +
        '" height="' +
        r2(Math.max(2, short * 0.008)) +
        '" fill="' +
        ACCENT +
        '"/>',
    );
  }

  /* frame: the crop the studio shoots inside */
  const frameInset = pad * between(0.42, 0.6);
  body.push(
    '<rect x="' +
      r2(frameInset) +
      '" y="' +
      r2(frameInset) +
      '" width="' +
      r2(width - frameInset * 2) +
      '" height="' +
      r2(height - frameInset * 2) +
      '" fill="none" stroke="' +
      INK +
      '" stroke-opacity="0.16" stroke-width="1"/>',
  );

  /* corner ticks */
  const tick = short * 0.05;
  const corners = [
    [frameInset, frameInset, 1, 1],
    [width - frameInset, frameInset, -1, 1],
    [frameInset, height - frameInset, 1, -1],
    [width - frameInset, height - frameInset, -1, -1],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    body.push(
      '<path d="M' +
        r2(cx) +
        " " +
        r2(cy + dy * tick) +
        "L" +
        r2(cx) +
        " " +
        r2(cy) +
        "L" +
        r2(cx + dx * tick) +
        " " +
        r2(cy) +
        '" fill="none" stroke="' +
        INK +
        '" stroke-opacity="0.5" stroke-width="1.25"/>',
    );
  }

  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
    width +
    " " +
    height +
    '" width="' +
    width +
    '" height="' +
    height +
    '" role="presentation">' +
    (defs.length ? "<defs>" + defs.join("") + "</defs>" : "") +
    body.join("") +
    "</svg>"
  );
}

/**
 * Hero graphic: wider, calmer, built from horizontal planes and one light pool
 * so it reads at a glance behind text.
 */
function heroGraphic() {
  const width = 1440;
  const height = 900;
  const rand = rng("hero-v1");
  const defs = [];
  const body = [];

  defs.push(
    '<linearGradient id="hero-ground" x1="0" y1="0" x2="0.25" y2="1">' +
      '<stop offset="0" stop-color="' +
      PAPER +
      '"/><stop offset="1" stop-color="' +
      PAPER_2 +
      '"/></linearGradient>',
    '<radialGradient id="hero-light" cx="0.5" cy="0.5" r="0.5">' +
      '<stop offset="0" stop-color="#ffffff" stop-opacity="1"/>' +
      '<stop offset="0.5" stop-color="#ffffff" stop-opacity="0.4"/>' +
      '<stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>',
    '<linearGradient id="hero-fade" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' +
      PAPER +
      '" stop-opacity="0"/>' +
      '<stop offset="1" stop-color="' +
      PAPER +
      '" stop-opacity="0.92"/></linearGradient>',
  );

  body.push('<rect width="' + width + '" height="' + height + '" fill="url(#hero-ground)"/>');
  body.push('<circle cx="1010" cy="300" r="560" fill="url(#hero-light)"/>');

  const bars = [
    { x: 118, y: 250, w: 268, h: 560, fill: PAPER_3, o: 0.9 },
    { x: 410, y: 178, w: 322, h: 632, fill: LINE, o: 0.62 },
    { x: 756, y: 300, w: 250, h: 510, fill: ACCENT_SOFT, o: 1 },
    { x: 1030, y: 214, w: 300, h: 596, fill: PAPER_3, o: 0.8 },
  ];
  for (const bar of bars) {
    body.push(
      '<rect x="' +
        bar.x +
        '" y="' +
        bar.y +
        '" width="' +
        bar.w +
        '" height="' +
        bar.h +
        '" rx="14" fill="' +
        bar.fill +
        '" opacity="' +
        bar.o +
        '"/>',
    );
  }

  body.push('<rect x="756" y="556" width="574" height="3" fill="' + ACCENT + '"/>');
  body.push(
    '<rect x="64" y="64" width="' +
      (width - 128) +
      '" height="' +
      (height - 128) +
      '" fill="none" stroke="' +
      INK +
      '" stroke-opacity="0.14" stroke-width="1"/>',
  );

  const tick = 34;
  for (const [cx, cy, dx, dy] of [
    [64, 64, 1, 1],
    [width - 64, 64, -1, 1],
    [64, height - 64, 1, -1],
    [width - 64, height - 64, -1, -1],
  ]) {
    body.push(
      '<path d="M' +
        cx +
        " " +
        (cy + dy * tick) +
        "L" +
        cx +
        " " +
        cy +
        "L" +
        (cx + dx * tick) +
        " " +
        cy +
        '" fill="none" stroke="' +
        INK +
        '" stroke-opacity="0.45" stroke-width="1.5"/>',
    );
  }

  body.push(
    '<rect x="0" y="' + (height - 260) + '" width="' + width + '" height="260" fill="url(#hero-fade)"/>',
  );
  void rand;

  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
    width +
    " " +
    height +
    '" width="' +
    width +
    '" height="' +
    height +
    '" role="presentation"><defs>' +
    defs.join("") +
    "</defs>" +
    body.join("") +
    "</svg>"
  );
}

/* ---------- the manifest ---------- */

const RATIO_SIZE = {
  "3:4": [900, 1200],
  "4:3": [1200, 900],
  "1:1": [1000, 1000],
};

const GALLERY = [
  ["self-photo", 4],
  ["keluarga", 4],
  ["produk", 4],
  ["sewa-ruangan", 3],
];
const GALLERY_RATIOS = ["3:4", "4:3", "1:1", "4:3", "1:1", "3:4"];
const GALLERY_OFFSET = { "self-photo": 0, keluarga: 2, produk: 4, "sewa-ruangan": 1 };

const PACKAGES = ["self-photo", "foto-keluarga", "foto-produk", "sewa-ruangan"];
const ROOMS = ["ruang-1", "ruang-2"];

function main() {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  let count = 0;
  const write = (name, svg) => {
    writeFileSync(join(outDir, name), svg, "utf8");
    count += 1;
  };

  write("hero.svg", heroGraphic());

  for (const [category, total] of GALLERY) {
    for (let i = 1; i <= total; i += 1) {
      const ratio = GALLERY_RATIOS[(i - 1 + GALLERY_OFFSET[category]) % GALLERY_RATIOS.length];
      const [w, h] = RATIO_SIZE[ratio];
      write("gallery-" + category + "-" + i + ".svg", compose("gallery-" + category + "-" + i, w, h));
    }
  }

  for (const id of PACKAGES) {
    write("package-" + id + ".svg", compose("package-" + id, 1200, 800, { accentChance: 1 }));
  }

  for (const id of ROOMS) {
    write("room-" + id + ".svg", compose("room-" + id, 1400, 900, { layout: "band" }));
  }

  write("wordmark-tile.svg", compose("wordmark-tile", 1200, 630, { layout: "stack" }));

  console.log("Wrote " + count + " deterministic SVG placeholders to public/graphics.");
}

main();
