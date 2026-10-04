// Draws the map of the Zwischenwelt: assets/welt/karte.jpg (2400 × 1600, 3:2).
//
//     node tools/karte.mjs                 writes assets/welt/karte.jpg
//     node tools/karte.mjs probe.jpg       writes somewhere else, to look first
//
// The map is drawn as a picture of lines and colours (SVG) and photographed
// with the browser that also tests the app (Playwright). The places stay
// where the table of the world puts them (data/welt.json, x and y in percent
// of the map): the app sets its markers on them, the drawing only shows what
// lies there. Everything that looks random comes from a fixed seed, so the
// map comes out the same every time.
//
// What is where (percent, see welt.xlsx):
//   Trümmerebene (west): Lager 22/58, Trümmerfeld 14/49, Pilzhain 11/36,
//     Alter Steinbruch 30/82, Stilles Ufer 32/40
//   Nebelmark (middle): Stille Quelle 36/14, Der Spalt 50/26, Nebelfurt 46/54,
//     Echohöhle 38/72, Dornengrat 58/72, Mondsee 50/88
//   Grenzland: Die Schlucht 66/46, Die lange Straße 72/14
//   Aschenland (east): Aschenhang 80/34, Turm der Stufen 88/64
//   Nordland: Weißes Tal 92/8

import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'assets', 'welt', 'karte.jpg'));
const W = 2400;
const H = 1600;

// --- helpers ---------------------------------------------------------------

// percent of the map -> pixels
const P = (x, y) => [(x * W) / 100, (y * H) / 100];
const f = (n) => n.toFixed(1);

// a random number generator with a fixed start, so every run is the same
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = seeded(20261004);
const between = (a, b) => a + (b - a) * rnd();

// a smooth closed or open line through points (Catmull-Rom as Bézier curves)
function smooth(points, closed = false) {
  const n = points.length;
  const at = (i) => points[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = `M ${f(points[0][0])} ${f(points[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i += 1) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return closed ? `${d} Z` : d;
}

// a line made rough like a hand-drawn coast: every piece is split and its
// middle pushed a little aside, a few times over
function roughen(points, depth, share, closed = true) {
  let pts = points;
  for (let k = 0; k < depth; k += 1) {
    const next = [];
    const n = closed ? pts.length : pts.length - 1;
    for (let i = 0; i < n; i += 1) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const nx = -(b[1] - a[1]) / (len || 1);
      const ny = (b[0] - a[0]) / (len || 1);
      const push = (rnd() - 0.5) * len * share;
      next.push(a, [(a[0] + b[0]) / 2 + nx * push, (a[1] + b[1]) / 2 + ny * push]);
    }
    if (!closed) next.push(pts[pts.length - 1]);
    pts = next;
  }
  return pts;
}

function inside(pt, poly) {
  let yes = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) yes = !yes;
  }
  return yes;
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// --- colours -------------------------------------------------------------------
// The colours of the app: petrol, ivory, copper orange, dove blue.

const C = {
  ink: '#22323a',
  inkSoft: '#4a5c62',
  sea: '#7c9ca1',
  seaDeep: '#5d7f85',
  seaLight: '#97b3b5',
  land: '#e7dcc4',
  sand: '#e2cc9f',
  moss: '#bcc7a2',
  mist: '#c8d4d2',
  ash: '#cdc3b5',
  snow: '#eef1ef',
  slate: '#58676b',
  water: '#7fa1a8',
  waterDark: '#5b7f87',
  copper: '#d9772f',
  copperDark: '#9c4a17',
  stone: '#ece4d2',
  stoneShade: '#a8a49a',
  crystal: '#d4ecef',
};

// --- the places (from the table of the world) --------------------------------

const world = JSON.parse(readFileSync(path.join(ROOT, 'data', 'welt.json'), 'utf8'));
const PLACE = Object.fromEntries(world.places.map((p) => [p.id, P(p.x, p.y)]));
const MARKERS = Object.values(PLACE);
// keeps loose things (stones, dots, tufts) off the markers of the app
const clearOfMarkers = (pt, r = 70) => MARKERS.every((m) => dist(pt, m) > r);

// --- the land ------------------------------------------------------------------
// The coast, clockwise from the north-west, in percent; it is roughened below.

const COAST_KEYS = [
  [13, 17], [18, 11], [25, 7.5], [32, 5.5], [40, 4.5], [47, 6.2], [52, 4.6], [60, 4.2],
  [68, 3.6], [76, 3.2], [83, 3.6], [89, 2.6], [95, 3.2], [97.2, 7], [96.6, 13], [97.4, 19],
  [95.8, 25], [96.4, 33], [97.6, 41], [96, 47], [96.8, 55], [95.6, 62], [93.4, 67], [95.6, 73],
  [94.8, 79], [91.5, 83.5], [86.5, 85], [83, 89.5], [77, 91], [70, 93.5], [63, 93.8], [57, 96],
  [52, 96.6], [47, 96], [41, 94.2], [35, 95], [28, 93.6], [22, 92.6], [16, 90], [11, 86],
  [7.5, 80], [5.4, 72], [3.6, 65], [4.8, 58], [3.4, 50], [4.2, 42], [3.4, 34], [5.2, 27], [8.6, 21],
];
const coast = roughen(COAST_KEYS.map(([x, y]) => P(x, y)), 4, 0.32);
const COAST = smooth(coast, true);
const onLand = (pt, margin = 0) => inside(pt, coast)
  && (margin === 0 || [[margin, 0], [-margin, 0], [0, margin], [0, -margin]].every(([dx, dy]) => inside([pt[0] + dx, pt[1] + dy], coast)));

// small islands in the sea
const ISLANDS = [[4, 89, 46, 26], [7.5, 93.5, 30, 18], [47, 1.6, 34, 12], [98.4, 46, 22, 30], [99, 90, 40, 26]];

// --- the water -------------------------------------------------------------------
// The river: from the Stille Quelle past the Stilles Ufer and through the
// Nebelfurt into the Mondsee, and from there on to the sea.

const SPRING = P(36, 12.6);
const LAKE = { c: P(50, 87.4), rx: 150, ry: 78 };
const RIVER = [
  SPRING, P(35.4, 18), P(33.6, 25), P(33.4, 32), P(34.6, 38.5), P(36.4, 44), P(40.2, 48.6),
  P(44.2, 51.6), P(46.2, 55.2), P(47.2, 61), P(46.2, 67.4), P(47, 73.6), P(48.8, 78.6),
  [LAKE.c[0] - 6, LAKE.c[1] - LAKE.ry + 26],
];
const OUTFLOW = [[LAKE.c[0] + 60, LAKE.c[1] + LAKE.ry - 24], P(53.2, 94), P(54.4, 98.5)];
const riverLine = roughen(RIVER, 2, 0.12, false);

// a river as a band that grows wider downstream
function riverBand(points, w0, w1) {
  const left = [];
  const right = [];
  points.forEach((p, i) => {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(points.length - 1, i + 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / len;
    const ny = (b[0] - a[0]) / len;
    const w = (w0 + (w1 - w0) * (i / (points.length - 1))) / 2;
    left.push([p[0] + nx * w, p[1] + ny * w]);
    right.push([p[0] - nx * w, p[1] - ny * w]);
  });
  return `${smooth(left)} L ${f(right[right.length - 1][0])} ${f(right[right.length - 1][1])} ${smooth(right.reverse()).slice(1)} Z`;
}

function blob(cx, cy, rx, ry, wobble = 0.12, n = 14) {
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (rnd() - 0.5) * wobble * 2;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return smooth(pts, true);
}

function water() {
  const out = [];
  const lake = blob(LAKE.c[0], LAKE.c[1], LAKE.rx, LAKE.ry, 0.07);
  const pond = blob(SPRING[0], SPRING[1] - 4, 64, 40, 0.1);
  const shore = blob(...P(33.6, 39.6), 46, 30, 0.12);     // the still water at the Stilles Ufer
  for (const [d, wd] of [[riverBand(riverLine, 16, 34), 1], [riverBand(OUTFLOW, 30, 36), 1]]) {
    out.push(`<path d="${d}" fill="${C.water}" stroke="${C.ink}" stroke-width="${2.4 * wd}" stroke-linejoin="round"/>`);
  }
  for (const d of [lake, pond, shore]) {
    out.push(`<path d="${d}" fill="${C.water}" stroke="${C.ink}" stroke-width="2.6"/>`);
  }
  // the rivers again without their ink, so they flow into the lake and the pond without a line between
  out.push(`<path d="${riverBand(riverLine, 11, 28)}" fill="${C.water}"/>`, `<path d="${riverBand(OUTFLOW, 25, 30)}" fill="${C.water}"/>`);
  // still rings in the basins, a moon on the Mondsee
  for (const k of [0.72, 0.46, 0.22]) {
    out.push(`<ellipse cx="${f(LAKE.c[0])}" cy="${f(LAKE.c[1])}" rx="${f(LAKE.rx * k)}" ry="${f(LAKE.ry * k)}" fill="none" stroke="${C.seaLight}" stroke-width="2" opacity="0.55"/>`);
  }
  const [mx, my] = [LAKE.c[0] + 62, LAKE.c[1] - 22];
  out.push(`<path d="M ${mx - 18} ${my - 20} A 24 24 0 1 0 ${mx - 18} ${my + 20} A 18 18 0 1 1 ${mx - 18} ${my - 20} Z" fill="#f4f1e6" opacity="0.85"/>`);
  out.push(`<ellipse cx="${f(SPRING[0])}" cy="${f(SPRING[1] - 4)}" rx="38" ry="22" fill="none" stroke="${C.seaLight}" stroke-width="2" opacity="0.6"/>`);
  // stones around the basin of the spring
  for (let i = 0; i < 14; i += 1) {
    const a = (i / 14) * Math.PI * 2;
    out.push(stone(SPRING[0] + Math.cos(a) * 78, SPRING[1] - 4 + Math.sin(a) * 50, 9, '#d9d2c0'));
  }
  return out.join('\n');
}

// --- the ground ---------------------------------------------------------------------
// Each land has its own colour, laid on softly so the borders are not hard.

function ground() {
  const tints = [
    [C.sand, 18, 66, 18, 30, 0.72],    // Trümmerebene
    [C.sand, 27, 84, 12, 10, 0.55],
    [C.moss, 11, 30, 10, 14, 0.95],    // the mushrooms
    [C.mist, 46, 40, 15, 30, 0.95],    // Nebelmark
    [C.mist, 42, 74, 12, 18, 0.7],
    ['#b9c1c0', 57, 72, 7, 9, 0.8],    // Dornengrat
    [C.ash, 84, 50, 14, 30, 0.95],     // Aschenland
    ['#d6c3a8', 80, 32, 7, 8, 0.75],   // warm dust of the Aschenhang
    ['#d9d3c2', 69, 52, 6, 40, 0.6],   // Grenzland
    [C.snow, 88, 10, 13, 10, 0.95],    // Nordland
    ['#e2e5df', 74, 10, 10, 8, 0.6],
  ];
  return tints.map(([colour, x, y, rx, ry, op]) => {
    const [cx, cy] = P(x, y);
    return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f((rx * W) / 100)}" ry="${f((ry * H) / 100)}" fill="${colour}" opacity="${op}" filter="url(#soft)"/>`;
  }).join('\n');
}

// scattered things, inside an ellipse (percent), on land and off the markers
function scatter(count, [x, y, rx, ry], draw, { margin = 30, clear = 70 } = {}) {
  const out = [];
  let tries = 0;
  while (out.length < count && tries < count * 40) {
    tries += 1;
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd());
    const pt = P(x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r);
    if (!onLand(pt, margin) || !clearOfMarkers(pt, clear) || nearWater(pt) || onLabel(pt)) continue;
    out.push(draw(pt[0], pt[1]));
  }
  return out.join('\n');
}

// where the names of the lands stand (percent: left, top, right, bottom)
const LABEL_AREAS = [[7, 66.6, 27.6, 71.6], [37, 38, 57, 43], [79.2, 38.8, 89.4, 43.4]];
const onLabel = ([x, y]) => LABEL_AREAS.some(([x0, y0, x1, y1]) => x >= (x0 * W) / 100 && x <= (x1 * W) / 100 && y >= (y0 * H) / 100 && y <= (y1 * H) / 100);

function nearWater(pt) {
  return riverLine.some((q) => dist(q, pt) < 40) || dist(pt, LAKE.c) < LAKE.rx + 20 || dist(pt, SPRING) < 90
    || (Math.abs(pt[0] - gorgeX(pt[1])) < 46 && pt[1] > GORGE_TOP && pt[1] < GORGE_BOTTOM);
}

// --- small things ---------------------------------------------------------------------

function stone(x, y, r, fill = C.slate) {
  const pts = [];
  const n = 5 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.5;
    const k = r * (0.7 + rnd() * 0.5);
    pts.push(`${f(x + Math.cos(a) * k)},${f(y + Math.sin(a) * k * 0.75)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
}

function column(x, y, h) {
  const w = 18;
  const top = y - h;
  const jag = `L ${x + w / 2} ${top + 6} L ${x + 3} ${top} L ${x - 2} ${top + 8} L ${x - w / 2} ${top + 3}`;
  return `<g stroke="${C.ink}" stroke-width="2" stroke-linejoin="round">
    <path d="M ${x - w / 2} ${y} L ${x + w / 2} ${y} L ${x + w / 2} ${top + 6} ${jag} Z" fill="${C.stone}"/>
    <path d="M ${x + 2} ${y} L ${x + 2} ${top + 8}" stroke-width="1.2" opacity="0.6"/>
    <rect x="${x - w / 2 - 5}" y="${y - 2}" width="${w + 10}" height="7" fill="${C.stone}"/></g>`;
}

function fallenColumn(x, y, len, angle) {
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)})" stroke="${C.ink}" stroke-width="2">
    <rect x="${-len / 2}" y="-8" width="${len}" height="16" fill="${C.stone}"/>
    <line x1="${-len / 2 + 10}" y1="-8" x2="${-len / 2 + 10}" y2="8" stroke-width="1.4"/>
    <line x1="${len / 2 - 10}" y1="-8" x2="${len / 2 - 10}" y2="8" stroke-width="1.4"/></g>`;
}

function mushroom(x, y, s, bright = true) {
  const cap = bright ? C.copper : '#c98b5c';
  return `<g stroke="${C.ink}" stroke-width="${f(Math.max(1.4, s * 0.06))}" stroke-linejoin="round">
    <path d="M ${f(x - s * 0.12)} ${f(y)} L ${f(x - s * 0.1)} ${f(y - s * 0.72)} L ${f(x + s * 0.1)} ${f(y - s * 0.72)} L ${f(x + s * 0.12)} ${f(y)} Z" fill="${C.stone}"/>
    <path d="M ${f(x - s * 0.5)} ${f(y - s * 0.66)} Q ${f(x - s * 0.46)} ${f(y - s * 1.12)} ${f(x)} ${f(y - s * 1.12)} Q ${f(x + s * 0.46)} ${f(y - s * 1.12)} ${f(x + s * 0.5)} ${f(y - s * 0.66)} Q ${f(x)} ${f(y - s * 0.56)} ${f(x - s * 0.5)} ${f(y - s * 0.66)} Z" fill="${cap}"/>
    <path d="M ${f(x - s * 0.44)} ${f(y - s * 0.68)} Q ${f(x)} ${f(y - s * 0.6)} ${f(x + s * 0.44)} ${f(y - s * 0.68)}" fill="none" stroke="${C.copperDark}" stroke-width="${f(Math.max(1, s * 0.04))}"/>
    <circle cx="${f(x - s * 0.18)}" cy="${f(y - s * 0.9)}" r="${f(s * 0.05)}" fill="#f6e7cf" stroke="none"/>
    <circle cx="${f(x + s * 0.16)}" cy="${f(y - s * 0.98)}" r="${f(s * 0.04)}" fill="#f6e7cf" stroke="none"/></g>`;
}

function deadTree(x, y, s) {
  const b = (dx, dy, ex, ey) => `M ${f(x + dx * s)} ${f(y - dy * s)} L ${f(x + ex * s)} ${f(y - ey * s)}`;
  return `<path d="${b(0, 0, 0.04, 1)} ${b(0.02, 0.55, -0.3, 0.85)} ${b(0.03, 0.7, 0.32, 0.98)} ${b(-0.18, 0.72, -0.26, 0.98)} ${b(0.03, 0.4, 0.22, 0.56)}" stroke="${C.ink}" stroke-width="${f(s * 0.05)}" stroke-linecap="round" fill="none"/>`;
}

function pine(x, y, s) {
  return `<g stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round" fill="#6f8b86">
    <path d="M ${x} ${y - s} L ${x + s * 0.32} ${y - s * 0.45} L ${x - s * 0.32} ${y - s * 0.45} Z"/>
    <path d="M ${x} ${y - s * 0.72} L ${x + s * 0.42} ${y - s * 0.12} L ${x - s * 0.42} ${y - s * 0.12} Z"/>
    <line x1="${x}" y1="${y - s * 0.12}" x2="${x}" y2="${y}" stroke-width="2.4"/></g>`;
}

function tuft(x, y, s = 12) {
  return `<path d="M ${x - s * 0.5} ${y - s * 0.7} L ${x - s * 0.15} ${y} M ${x} ${y - s} L ${x} ${y} M ${x + s * 0.55} ${y - s * 0.75} L ${x + s * 0.15} ${y}" stroke="${C.inkSoft}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`;
}

function hill(x, y, w, h, fill = C.stone) {
  return `<g stroke="${C.ink}" stroke-width="2"><path d="M ${f(x - w / 2)} ${f(y)} Q ${f(x - w * 0.32)} ${f(y - h * 1.3)} ${f(x)} ${f(y - h)} Q ${f(x + w * 0.32)} ${f(y - h * 1.3)} ${f(x + w / 2)} ${f(y)}" fill="${fill}"/>
    <path d="M ${f(x + w * 0.12)} ${f(y - h * 0.82)} Q ${f(x + w * 0.3)} ${f(y - h * 0.7)} ${f(x + w * 0.36)} ${f(y - h * 0.24)}" fill="none" stroke-width="1.4" opacity="0.7"/></g>`;
}

// A mountain: lit on the left, the right side in shadow with a few strokes.
// kind: stone, snow, thorn (black splinters), ash
function mountain(x, y, w, h, kind = 'stone') {
  const peak = [x + (rnd() - 0.5) * w * 0.16, y - h];
  const left = [x - w / 2, y];
  const right = [x + w / 2, y];
  const kinkL = [left[0] + (peak[0] - left[0]) * 0.55 + (rnd() - 0.5) * w * 0.08, y - h * 0.55];
  const kinkR = [right[0] + (peak[0] - right[0]) * 0.5 + (rnd() - 0.5) * w * 0.08, y - h * 0.5];
  const foot = [x + w * 0.08, y];
  const light = { stone: C.stone, snow: C.snow, thorn: '#6d7779', ash: '#d8cdbd' }[kind];
  const shade = { stone: C.stoneShade, snow: '#a9bcc0', thorn: '#2f3b3e', ash: '#9d9182' }[kind];
  const outline = `M ${f(left[0])} ${f(left[1])} L ${f(kinkL[0])} ${f(kinkL[1])} L ${f(peak[0])} ${f(peak[1])} L ${f(kinkR[0])} ${f(kinkR[1])} L ${f(right[0])} ${f(right[1])} Z`;
  const shadow = `M ${f(peak[0])} ${f(peak[1])} L ${f(kinkR[0])} ${f(kinkR[1])} L ${f(right[0])} ${f(right[1])} L ${f(foot[0])} ${f(foot[1])} Z`;
  let extra = '';
  if (kind === 'snow') {
    const cap = `M ${f(peak[0])} ${f(peak[1])} L ${f(peak[0] - w * 0.17)} ${f(peak[1] + h * 0.34)} L ${f(peak[0] - w * 0.06)} ${f(peak[1] + h * 0.27)} L ${f(peak[0] + w * 0.02)} ${f(peak[1] + h * 0.38)} L ${f(peak[0] + w * 0.12)} ${f(peak[1] + h * 0.28)} Z`;
    extra = `<path d="${cap}" fill="#ffffff" stroke="none"/>`;
  }
  const strokes = [];
  for (let i = 1; i <= 4; i += 1) {
    const t = i / 5;
    const sx = peak[0] + (foot[0] - peak[0]) * t;
    const sy = peak[1] + (foot[1] - peak[1]) * t;
    strokes.push(`M ${f(sx)} ${f(sy)} l ${f(w * 0.16 * (1 - t * 0.3))} ${f(h * 0.1)}`);
  }
  const hatch = kind === 'thorn' ? '' : `<path d="${strokes.join(' ')}" stroke="${C.ink}" stroke-width="1.3" opacity="0.55" fill="none"/>`;
  let thorns = '';
  if (kind === 'thorn') {
    const ticks = [];
    for (let i = 1; i < 6; i += 1) {
      const t = i / 6;
      const px = left[0] + (peak[0] - left[0]) * t;
      const py = left[1] + (peak[1] - left[1]) * t;
      ticks.push(`M ${f(px)} ${f(py)} l ${f(-8 - rnd() * 6)} ${f(-6 - rnd() * 6)}`);
    }
    thorns = `<path d="${ticks.join(' ')}" stroke="${C.ink}" stroke-width="2" stroke-linecap="round" fill="none"/>`;
  }
  return `<g stroke-linejoin="round"><path d="${outline}" fill="${light}"/><path d="${shadow}" fill="${shade}"/>${extra}${hatch}${thorns}
    <path d="${outline}" fill="none" stroke="${C.ink}" stroke-width="2.4"/></g>`;
}

// --- the places' own pictures ---------------------------------------------------------

function ruinedArch(x, y) {
  return `<g stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round" fill="${C.stone}">
    <path d="M ${x - 44} ${y} L ${x - 44} ${y - 62} Q ${x - 44} ${y - 100} ${x - 6} ${y - 104} L ${x - 2} ${y - 92} Q ${x - 28} ${y - 88} ${x - 28} ${y - 60} L ${x - 28} ${y} Z"/>
    <path d="M ${x + 28} ${y} L ${x + 28} ${y - 56} L ${x + 34} ${y - 70} L ${x + 44} ${y - 62} L ${x + 44} ${y} Z"/>
    <rect x="${x - 50}" y="${y - 3}" width="100" height="8"/></g>`;
}

function quarry(x, y) {
  const out = [`<g stroke="${C.ink}" stroke-width="2" stroke-linejoin="round">`];
  for (let i = 0; i < 4; i += 1) {
    const w = 180 - i * 34;
    out.push(`<path d="M ${x - w / 2} ${y - i * 18} L ${x + w / 2} ${y - i * 18} L ${x + w / 2 - 8} ${y - i * 18 - 18} L ${x - w / 2 + 8} ${y - i * 18 - 18} Z" fill="${i % 2 ? '#ddd3bd' : '#e9e0cc'}"/>`);
  }
  out.push('</g>');
  for (const [dx, dy, s] of [[-120, 6, 1], [116, 2, 0.8], [-96, 30, 0.7], [140, 26, 0.9]]) {
    out.push(`<rect x="${x + dx - 14 * s}" y="${y + dy - 12 * s}" width="${28 * s}" height="${20 * s}" fill="${C.stone}" stroke="${C.ink}" stroke-width="1.8"/>`);
  }
  return out.join('\n');
}

// Der Spalt: two rock walls, barely a shoulder apart
function cleft(x, y) {
  const rockL = `M ${x - 120} ${y + 40} L ${x - 96} ${y - 30} L ${x - 54} ${y - 70} L ${x - 20} ${y - 64} L ${x - 10} ${y + 40} Z`;
  const rockR = `M ${x + 6} ${y + 44} L ${x + 14} ${y - 76} L ${x + 50} ${y - 86} L ${x + 92} ${y - 40} L ${x + 124} ${y + 44} Z`;
  return `<g stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round">
    <path d="M ${x - 14} ${y + 42} L ${x - 20} ${y - 62} L ${x + 14} ${y - 74} L ${x + 8} ${y + 44} Z" fill="#1d2a2e"/>
    <path d="${rockL}" fill="#cfc9bb"/><path d="M ${x - 54} ${y - 70} L ${x - 20} ${y - 64} L ${x - 10} ${y + 40} L ${x - 40} ${y + 40} Z" fill="#8f938c"/>
    <path d="${rockR}" fill="#d8d2c4"/><path d="M ${x + 14} ${y - 76} L ${x + 50} ${y - 86} L ${x + 40} ${y + 44} L ${x + 6} ${y + 44} Z" fill="#8f938c"/></g>`;
}

function cave(x, y) {
  return `<g stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round">
    <path d="M ${x - 110} ${y} Q ${x - 90} ${y - 96} ${x} ${y - 100} Q ${x + 92} ${y - 96} ${x + 110} ${y} Z" fill="${C.stone}"/>
    <path d="M ${x - 34} ${y} L ${x - 34} ${y - 34} Q ${x} ${y - 74} ${x + 34} ${y - 34} L ${x + 34} ${y} Z" fill="#1d2a2e"/>
    <path d="M ${x + 40} ${y - 84} Q ${x + 74} ${y - 70} ${x + 84} ${y - 30}" fill="none" stroke-width="1.5" opacity="0.6"/></g>`;
}

// Turm der Stufen: a tall tower with steps winding round it
function tower(x, y) {
  const out = [`<g stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round">`];
  out.push(`<path d="M ${x - 34} ${y} L ${x - 26} ${y - 190} L ${x + 26} ${y - 190} L ${x + 34} ${y} Z" fill="${C.stone}"/>`);
  out.push(`<path d="M ${x + 8} ${y} L ${x + 10} ${y - 190} L ${x + 26} ${y - 190} L ${x + 34} ${y} Z" fill="${C.stoneShade}"/>`);
  out.push(`<path d="M ${x - 36} ${y - 190} L ${x + 36} ${y - 190} L ${x + 30} ${y - 204} L ${x - 30} ${y - 204} Z" fill="${C.stone}"/>`);
  out.push(`<path d="M ${x - 26} ${y - 204} L ${x} ${y - 262} L ${x + 26} ${y - 204} Z" fill="#7d8d8f"/>`);
  for (let i = 0; i < 6; i += 1) {   // the steps, winding up
    const yy = y - 18 - i * 28;
    out.push(`<path d="M ${x - 32 + i * 1.2} ${yy} L ${x + 32 - i * 1.2} ${yy - 14}" fill="none" stroke-width="1.8"/>`);
  }
  out.push(`<rect x="${x - 6}" y="${y - 160}" width="12" height="20" fill="#1d2a2e"/><rect x="${x - 6}" y="${y - 100}" width="12" height="18" fill="#1d2a2e"/>`);
  out.push('</g>');
  return out.join('\n');
}

// a small stone throne high on the ash slope
function throne(x, y) {
  return `<g stroke="${C.ink}" stroke-width="2" stroke-linejoin="round" fill="${C.stone}">
    <path d="M ${x - 18} ${y} L ${x - 18} ${y - 52} L ${x - 10} ${y - 60} L ${x + 10} ${y - 60} L ${x + 18} ${y - 52} L ${x + 18} ${y} Z"/>
    <rect x="${x - 24}" y="${y - 24}" width="48" height="10"/><rect x="${x - 26}" y="${y - 2}" width="52" height="8"/></g>`;
}

function compass(x, y, r) {
  const pts = [];
  for (let i = 0; i < 16; i += 1) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const k = i % 4 === 0 ? r : i % 2 === 0 ? r * 0.55 : r * 0.24;
    pts.push(`${f(x + Math.cos(a) * k)},${f(y + Math.sin(a) * k)}`);
  }
  return `<g stroke="${C.ink}" stroke-width="2">
    <circle cx="${x}" cy="${y}" r="${r * 0.78}" fill="none" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="${r * 0.86}" fill="none" stroke-width="1"/>
    <polygon points="${pts.join(' ')}" fill="${C.stone}" stroke-linejoin="round"/>
    <path d="M ${x} ${y - r} L ${x + r * 0.12} ${y} L ${x} ${y + r} Z M ${x - r} ${y} L ${x} ${y + r * 0.12} L ${x + r} ${y} Z" fill="${C.ink}"/>
    <circle cx="${x}" cy="${y}" r="7" fill="${C.copper}"/>
    <text x="${x}" y="${y - r - 10}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="30" fill="${C.ink}" stroke="none">N</text></g>`;
}

// --- the Schlucht: a deep cleft from north to south, with the remains of a bridge

const GORGE_TOP = (H * 7) / 100;
const GORGE_BOTTOM = (H * 84) / 100;
const GORGE = roughen([P(65.6, 7), P(66.2, 20), P(65.4, 34), P(66.2, 45), P(65.6, 58), P(64.8, 72), P(65.2, 84)], 3, 0.18, false);
function gorgeX(y) {
  for (let i = 0; i < GORGE.length - 1; i += 1) {
    const [a, b] = [GORGE[i], GORGE[i + 1]];
    if (y >= a[1] && y <= b[1]) return a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1] || 1);
  }
  return GORGE[0][0];
}

function gorge() {
  const width = (t) => 10 + 30 * Math.sin(Math.PI * t);    // narrow at both ends
  const left = [];
  const right = [];
  GORGE.forEach((p, i) => {
    const w = width(i / (GORGE.length - 1)) + (rnd() - 0.5) * 6;
    left.push([p[0] - w, p[1]]);
    right.push([p[0] + w, p[1]]);
  });
  const body = `${smooth(left)} L ${f(right[right.length - 1][0])} ${f(right[right.length - 1][1])} ${smooth([...right].reverse()).slice(1)} Z`;
  const ticks = [];
  for (let i = 1; i < GORGE.length - 1; i += 2) {
    ticks.push(`M ${f(left[i][0])} ${f(left[i][1])} l -14 3`, `M ${f(right[i][0])} ${f(right[i][1])} l 14 -3`);
  }
  // the old bridge: a stub on each edge, of the rest only chains hanging down
  const by = (H * 44.6) / 100;
  const edgeAt = (line) => {
    for (let i = 0; i < line.length - 1; i += 1) {
      const [a, b] = [line[i], line[i + 1]];
      if (by >= a[1] && by <= b[1]) return a[0] + ((b[0] - a[0]) * (by - a[1])) / (b[1] - a[1] || 1);
    }
    return line[0][0];
  };
  const [lx, rx] = [edgeAt(left), edgeAt(right)];
  const bridge = `<g stroke="${C.ink}" stroke-width="2" stroke-linejoin="round">
    <path d="M ${f(lx + 10)} ${f(by - 4)} q 6 34 -2 62 M ${f(lx + 10)} ${f(by + 4)} q 14 26 12 48 M ${f(rx - 10)} ${f(by - 4)} q -8 30 0 54" fill="none" stroke="#cfc7b4" stroke-width="3" stroke-dasharray="4 3"/>
    <rect x="${f(lx - 48)}" y="${f(by - 9)}" width="62" height="18" fill="#b7672f"/>
    <rect x="${f(rx - 14)}" y="${f(by - 9)}" width="62" height="18" fill="#b7672f"/>
    <path d="M ${f(lx - 36)} ${f(by - 9)} v 18 M ${f(lx - 20)} ${f(by - 9)} v 18 M ${f(rx + 20)} ${f(by - 9)} v 18 M ${f(rx + 36)} ${f(by - 9)} v 18" stroke-width="1.2" fill="none"/></g>`;
  return `<path d="${body}" fill="#2b3c40" stroke="${C.ink}" stroke-width="2.6"/>
    <path d="${smooth(GORGE)}" fill="none" stroke="#14201f" stroke-width="5" opacity="0.8"/>
    <path d="${ticks.join(' ')}" stroke="${C.ink}" stroke-width="1.8" fill="none"/>${bridge}`;
}

// --- ways ---------------------------------------------------------------------------
// Die lange Straße: straight and paved, from the bridge to the north and off the map
// to the east; footpaths as dotted lines between the places.

function roads() {
  const road = [[gorgeX((H * 44.6) / 100) + 70, (H * 44.6) / 100], P(69.6, 34), P(71, 22), P(72, 14.5), P(80, 12.2), P(88, 10.4), P(97, 9)];
  const d = smooth(road);
  const out = [
    `<path d="${d}" fill="none" stroke="${C.inkSoft}" stroke-width="26" stroke-linecap="round" opacity="0.55"/>`,
    `<path d="${d}" fill="none" stroke="#e5d9bd" stroke-width="20" stroke-linecap="round"/>`,
    `<path d="${d}" fill="none" stroke="${C.inkSoft}" stroke-width="2" stroke-dasharray="3 10" opacity="0.8"/>`,
  ];
  const path = (a, b, bend) => {
    const [ax, ay] = PLACE[a];
    const [bx, by] = PLACE[b];
    const mx = (ax + bx) / 2 - (by - ay) * bend;
    const my = (ay + by) / 2 + (bx - ax) * bend;
    return `<path d="M ${f(ax)} ${f(ay)} Q ${f(mx)} ${f(my)} ${f(bx)} ${f(by)}" fill="none" stroke="#5f5a4c" stroke-width="3.2" stroke-dasharray="1 11" stroke-linecap="round" opacity="0.75"/>`;
  };
  const pairs = [
    ['lager', 'truemmerfeld', 0.1], ['truemmerfeld', 'pilzhain', -0.12], ['lager', 'steinbruch', 0.12], ['lager', 'stillesufer', -0.1],
    ['lager', 'echohoehle', 0.1], ['lager', 'nebelfurt', -0.06], ['stillesufer', 'stillequelle', 0.08], ['nebelfurt', 'spalt', -0.1],
    ['nebelfurt', 'dornengrat', 0.08], ['nebelfurt', 'mondsee', -0.1], ['nebelfurt', 'schlucht', 0.06], ['schlucht', 'aschenhang', -0.08],
    ['schlucht', 'turm', 0.1], ['echohoehle', 'mondsee', 0.12],
  ];
  out.push(...pairs.map(([a, b, bend]) => path(a, b, bend)));
  return out.join('\n');
}

// --- everything that stands on the land, back to front ---------------------------------
// Every thing comes with the box it fills (left, top, right, bottom). A thing
// whose box does not lie wholly on the land is left out and named, so that
// nothing is cut off by the coast.

const skipped = [];

function features() {
  const items = [];                         // [y for the order, svg]
  const add = (name, y, svg, [x0, y0, x1, y1]) => {
    const corners = [[x0, y0], [x1, y0], [x0, y1], [x1, y1], [(x0 + x1) / 2, y0]];
    if (corners.every((c) => onLand(c, 10))) items.push([y, svg]);
    else skipped.push(name);
  };
  const at = (x, y) => P(x, y);
  const peak = (kind) => ([x, y, w, h]) => {
    const [px, py] = at(x, y);
    add(`${kind} ${x}/${y}`, py, mountain(px, py, w, h, kind), [px - w / 2, py - h * 1.02, px + w / 2, py]);
  };
  const dome = (fill) => ([x, y, w, h]) => {
    const [px, py] = at(x, y);
    add(`hill ${x}/${y}`, py, hill(px, py, w, h, fill), [px - w / 2, py - h * 1.05, px + w / 2, py]);
  };

  // Trümmerebene: fallen columns, broken columns; the ruined arch; the quarry
  for (const [x, y, len, deg] of [[17, 54, 90, -18], [26, 63, 76, 12], [12, 60, 64, 30], [24, 47, 70, -8], [29, 70, 60, 20], [17.4, 75, 80, -18]]) {
    const [px, py] = at(x, y);
    add(`fallen ${x}/${y}`, py, fallenColumn(px, py, len, deg), [px - len / 2, py - 20, px + len / 2, py + 20]);
  }
  for (const [x, y, h] of [[9, 52, 70], [19, 46.5, 54], [27, 56, 80], [14.2, 64.2, 56], [6.8, 62, 70], [31, 63, 50], [23, 76, 58], [12, 76, 46]]) {
    const [px, py] = at(x, y);
    add(`column ${x}/${y}`, py, column(px, py, h), [px - 16, py - h, px + 16, py + 5]);
  }
  { const [px, py] = at(26, 31); add('arch', py, ruinedArch(px, py), [px - 50, py - 104, px + 50, py + 5]); }
  { const [px, py] = at(30, 78.4); add('quarry', py, quarry(px, py), [px - 160, py - 72, px + 160, py + 40]); }

  // the mushrooms of the Pilzhain, tall as columns, and a few among the rubble
  for (const [x, y, s] of [[10.6, 31, 108], [14.8, 29.8, 124], [17.4, 30.6, 100], [9.6, 33.6, 84], [15.2, 35, 70], [6.8, 39, 62],
    [20.4, 27.6, 76], [18.4, 40.4, 60], [21.4, 33.4, 56], [24, 42, 48], [26.5, 52, 56], [7.6, 46, 52], [33, 86, 46]]) {
    const [px, py] = at(x, y);
    add(`mushroom ${x}/${y}`, py, mushroom(px, py, s, s > 60), [px - s / 2, py - s * 1.12, px + s / 2, py]);
  }

  // hills and peaks in the north-west, behind the Pilzhain
  [[19.4, 19.6, 96, 80], [22.8, 18, 80, 66], [16.4, 22.6, 70, 52], [25.8, 16.4, 70, 54]].forEach(peak('stone'));
  [[28, 22, 120, 40], [31, 26.6, 90, 32], [8.8, 75, 100, 34], [36, 60, 110, 36], [41, 84, 130, 40]].forEach(dome(C.stone));

  // Nebelmark: the range in the north, the cleft, the cave, hills
  [[41, 14.6, 130, 112], [45.6, 14.2, 110, 96], [49.8, 15, 120, 100], [54, 13.6, 100, 112], [58.4, 15.2, 110, 92],
    [43.6, 18.2, 80, 62], [52.4, 19, 90, 64], [61, 18.4, 70, 60]].forEach(peak('stone'));
  { const [px, py] = at(50, 23.2); add('cleft', py, cleft(px, py), [px - 124, py - 88, px + 124, py + 44]); }
  { const [px, py] = at(38, 68.6); add('cave', py, cave(px, py), [px - 110, py - 100, px + 110, py]); }
  [[54, 44, 110, 38], [57.6, 49.2, 90, 30], [39.6, 31, 90, 30], [56, 60, 120, 34], [43, 63, 80, 26]].forEach(dome('#e3e4dc'));
  // Dornengrat: a ridge of black splinters
  [[52.6, 69.4, 80, 96], [55.4, 71.8, 70, 120], [58.4, 69, 90, 108], [61, 72.4, 70, 90], [56.6, 75.6, 60, 70],
    [53.6, 76, 56, 58], [60.6, 77.6, 60, 64]].forEach(peak('thorn'));

  // Grenzland and Aschenland: ash slopes with the throne, dead trees, the tower, low ridges in the south
  [[77, 30, 170, 96], [82.4, 31, 150, 120], [79.6, 26.6, 110, 70], [86.6, 29, 110, 72]].forEach(peak('ash'));
  { const [px, py] = at(82.2, 22.6); add('throne', py, throne(px, py), [px - 26, py - 60, px + 26, py + 6]); }
  { const [px, py] = at(88, 60.4); add('tower', py + 1, tower(px, py), [px - 36, py - 262, px + 36, py]); }
  for (const [x, y, s] of [[73, 40, 60], [76, 50, 70], [83, 46, 56], [91, 44, 62], [74.6, 62, 66], [80, 70, 58], [92, 74, 54], [70.6, 74, 50], [85, 78, 60], [89, 52, 48]]) {
    const [px, py] = at(x, y);
    add(`tree ${x}/${y}`, py, deadTree(px, py, s), [px - s * 0.3, py - s, px + s * 0.32, py]);
  }
  [[76, 82, 110, 90], [80, 80.4, 90, 70], [84, 83, 100, 80], [72.6, 84, 80, 56]].forEach(peak('stone'));

  // Nordland: snowy peaks round the Weißes Tal, a few pines along the road
  [[88.6, 16.6, 120, 90], [93.4, 17, 84, 74], [80, 18.4, 110, 74], [92.4, 22.4, 90, 66], [86, 23, 80, 56], [84.2, 13.6, 70, 50]].forEach(peak('snow'));
  for (const [x, y, s] of [[74.4, 19.2, 40], [76.2, 20.6, 34], [70, 9.4, 36], [72.6, 8.8, 30], [90.6, 26.6, 34], [94, 27, 30]]) {
    const [px, py] = at(x, y);
    add(`pine ${x}/${y}`, py, pine(px, py, s), [px - s * 0.42, py - s, px + s * 0.42, py]);
  }

  items.sort((p1, p2) => p1[0] - p2[0]);
  return items.map(([, svg]) => svg).join('\n');
}

// loose stones, ash, marsh and snow, scattered
function textures() {
  return [
    scatter(150, [18, 62, 15, 26], (x, y) => stone(x, y, 5 + rnd() * 7, rnd() < 0.5 ? C.slate : '#d6cdb7')),
    scatter(40, [30, 84, 7, 7], (x, y) => stone(x, y, 6 + rnd() * 6, '#d6cdb7')),
    scatter(70, [46, 46, 13, 32], (x, y) => tuft(x, y, 10 + rnd() * 6), { clear: 60 }),
    scatter(260, [83, 54, 13, 30], (x, y) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.6 + rnd() * 1.8)}" fill="#6e665c" opacity="0.7"/>`, { clear: 50 }),
    scatter(40, [84, 56, 12, 26], (x, y) => `<path d="M ${f(x - 22)} ${f(y)} q 22 -12 44 0" fill="none" stroke="#8c8173" stroke-width="2"/>`, { clear: 60 }),
    scatter(36, [11, 30, 8, 11], (x, y) => tuft(x, y, 9), { clear: 50 }),
  ].join('\n');
}

// the mist of the Nebelmark, lying in bands
function mist() {
  const out = [];
  for (const [x, y, rx, ry] of [[44, 34, 9, 2.2], [52, 46, 10, 2], [40, 58, 8, 1.8], [50, 64, 9, 2], [47, 78, 7, 1.6], [37, 26, 6, 1.6]]) {
    const [cx, cy] = P(x, y);
    out.push(`<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f((rx * W) / 100)}" ry="${f((ry * H) / 100)}" fill="#ffffff" opacity="0.42" filter="url(#mist)"/>`);
  }
  return out.join('\n');
}

// --- the sea -------------------------------------------------------------------------------

function sea() {
  const out = [];
  for (let i = 0; i < 90; i += 1) {
    const pt = [between(40, W - 40), between(40, H - 40)];
    if (onLand(pt) || coast.some((q) => dist(q, pt) < 90)) continue;
    out.push(`<path d="M ${f(pt[0] - 18)} ${f(pt[1])} q 9 -7 18 0 t 18 0" fill="none" stroke="#557a80" stroke-width="2" opacity="0.6"/>`);
  }
  return out.join('\n');
}

// --- labels, title, frame -------------------------------------------------------------------

function label(text, x, y, size, { spacing = 0.32, rotate = 0, opacity = 0.78, colour = C.ink } = {}) {
  const [px, py] = P(x, y);
  return `<text x="${f(px)}" y="${f(py)}" text-anchor="middle" font-family="Cinzel" font-weight="600" font-size="${size}" letter-spacing="${f(size * spacing)}" fill="${colour}" opacity="${opacity}" transform="rotate(${rotate} ${f(px)} ${f(py)})">${text}</text>`;
}

function labels() {
  return [
    label('TRÜMMEREBENE', 17.2, 70, 36, { rotate: -3 }),
    label('NEBELMARK', 46.6, 41.4, 54),
    label('GRENZLAND', 69.4, 60, 30, { rotate: -88, opacity: 0.55 }),
    label('ASCHENLAND', 84, 41.6, 46),
    label('NORDLAND', 82.4, 7.6, 32, { opacity: 0.7 }),
    label('DAS NEBELMEER', 15, 97.4, 34, { colour: '#294348', opacity: 0.6 }),
  ].join('\n');
}

function title() {
  const [x, y, w, h] = [70, 64, 560, 170];
  return `<g>
    <rect x="${x + 8}" y="${y + 10}" width="${w}" height="${h}" fill="#000" opacity="0.18"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ece3cd" stroke="${C.ink}" stroke-width="3"/>
    <rect x="${x + 12}" y="${y + 12}" width="${w - 24}" height="${h - 24}" fill="none" stroke="${C.ink}" stroke-width="1.4"/>
    <text x="${x + w / 2}" y="${y + 86}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="46" letter-spacing="2" fill="${C.ink}">DIE ZWISCHENWELT</text>
    <path d="M ${x + 90} ${y + 108} L ${x + w - 90} ${y + 108}" stroke="${C.ink}" stroke-width="1.6"/>
    <path d="M ${x + w / 2 - 8} ${y + 108} L ${x + w / 2} ${y + 100} L ${x + w / 2 + 8} ${y + 108} L ${x + w / 2} ${y + 116} Z" fill="${C.copper}" stroke="${C.ink}" stroke-width="1.4"/>
    <text x="${x + w / 2}" y="${y + 144}" text-anchor="middle" font-family="Cinzel" font-weight="600" font-size="24" letter-spacing="7" fill="${C.inkSoft}">KARTE DES ENVOY</text></g>`;
}

function frame() {
  const out = [`<rect x="11" y="11" width="${W - 22}" height="${H - 22}" fill="none" stroke="#1b292d" stroke-width="22"/>`];
  const seg = 80;
  for (let x = 22; x < W - 22; x += seg * 2) out.push(`<rect x="${x}" y="17" width="${seg}" height="10" fill="#c9d3cf"/><rect x="${x + seg}" y="${H - 27}" width="${seg}" height="10" fill="#c9d3cf"/>`);
  for (let y = 22; y < H - 22; y += seg * 2) out.push(`<rect x="17" y="${y + seg}" width="10" height="${seg}" fill="#c9d3cf"/><rect x="${W - 27}" y="${y}" width="10" height="${seg}" fill="#c9d3cf"/>`);
  out.push(`<rect x="34" y="34" width="${W - 68}" height="${H - 68}" fill="none" stroke="#1b292d" stroke-width="2.4"/>`);
  return out.join('\n');
}

// paper: grain, folds and a little shade at the edges, over everything
function paper() {
  const folds = [W / 3, (2 * W) / 3].map((x) => `<line x1="${f(x)}" y1="0" x2="${f(x)}" y2="${H}" stroke="#ffffff" stroke-width="3" opacity="0.22"/><line x1="${f(x + 3)}" y1="0" x2="${f(x + 3)}" y2="${H}" stroke="#000" stroke-width="2" opacity="0.06"/>`);
  folds.push(`<line x1="0" y1="${H / 2}" x2="${W}" y2="${H / 2}" stroke="#ffffff" stroke-width="3" opacity="0.2"/><line x1="0" y1="${H / 2 + 3}" x2="${W}" y2="${H / 2 + 3}" stroke="#000" stroke-width="2" opacity="0.05"/>`);
  return `<rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.5" style="mix-blend-mode:multiply"/>
    ${folds.join('\n')}
    <rect width="${W}" height="${H}" fill="url(#vignette)"/>`;
}

// --- the whole picture ------------------------------------------------------------------------

function svg() {
  const islands = ISLANDS.map(([x, y, rx, ry]) => blob(...P(x, y), rx, ry, 0.2, 9));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <clipPath id="land"><path d="${COAST}"/></clipPath>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="60"/></filter>
    <filter id="mist" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="18"/></filter>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.33  0 0 0 0.55 0"/></filter>
    <radialGradient id="seaShade" cx="50%" cy="50%" r="75%"><stop offset="0.45" stop-color="${C.sea}"/><stop offset="1" stop-color="${C.seaDeep}"/></radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="72%"><stop offset="0.7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1b292d" stop-opacity="0.32"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#seaShade)"/>
  ${sea()}
  <g fill="none" stroke-linejoin="round">
    <path d="${COAST}" stroke="${C.seaLight}" stroke-width="110" opacity="0.45"/>
    <path d="${COAST}" stroke="${C.seaLight}" stroke-width="60" opacity="0.55"/>
    <path d="${COAST}" stroke="#4f747a" stroke-width="92" opacity="0.5"/><path d="${COAST}" stroke="${C.sea}" stroke-width="88" opacity="0.9"/>
    <path d="${COAST}" stroke="#4f747a" stroke-width="50" opacity="0.6"/><path d="${COAST}" stroke="${C.seaLight}" stroke-width="46"/>
  </g>
  ${islands.map((d) => `<path d="${d}" fill="${C.land}" stroke="${C.ink}" stroke-width="2.4"/>`).join('\n')}
  <path d="${COAST}" fill="${C.land}"/>
  <g clip-path="url(#land)">
    ${ground()}
    ${textures()}
    ${water()}
    ${gorge()}
    ${roads()}
    ${mist()}
    ${features()}
  </g>
  <path d="${COAST}" fill="none" stroke="${C.ink}" stroke-width="3.4" stroke-linejoin="round"/>
  <path d="${riverBand(OUTFLOW.slice(1), 31, 36)}" fill="${C.water}"/>
  ${labels()}
  ${title()}
  ${compass(...P(93.4, 89.8), 74)}
  ${paper()}
  ${frame()}
</svg>`;
}

// --- photograph it -----------------------------------------------------------------------------

async function main() {
  const require = createRequire(import.meta.url);
  let playwright;
  try {
    playwright = require('playwright');
  } catch {
    playwright = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
  const font = (weight) => `@font-face { font-family: 'Cinzel'; font-weight: ${weight}; src: url('file://${path.join(ROOT, 'assets', 'fonts', `cinzel-latin-${weight}-normal.woff2`)}'); }`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${font(600)}${font(700)} html,body{margin:0;background:#000}</style></head><body>${svg()}</body></html>`;
  const file = path.join(mkdtempSync(path.join(os.tmpdir(), 'karte-')), 'karte.html');
  writeFileSync(file, html);
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.goto(`file://${file}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: OUT, type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: W, height: H } });
  await browser.close();
  console.log(path.relative(ROOT, OUT));
  if (skipped.length) console.log(`left out (not wholly on the land): ${skipped.join(', ')}`);
}

main();
