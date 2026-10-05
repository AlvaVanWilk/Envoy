// Hair and skin colour of the Envoy. Every figure is drawn in one skin and
// one hair colour (see FIGURES in config.js). Here those pixels are painted
// in the chosen colours, in the browser; the result is kept for the session.
//
// Which pixel of the base figure is skin and which is hair follows from its
// hue: skin is orange (5° to 31°), hair is more yellow (31° to 60°) and only
// occurs in the upper part of the picture. The shading stays as drawn:
// every colour channel keeps its ratio to the drawn colour.
// In clothing layers only pixels with exactly the tint of the drawn skin
// are painted, for example the fingertips in fingerless gloves.
// The portrait is painted like the base figure, with the same factors, and
// so is a picture of the Envoy doing an exercise (there the hair may lie
// anywhere in the picture).
//
// A piece of clothing with a colour of its own (see world/clothes.js) is
// dyed here too, its layer on the figure as well as its icon: see dyeLayer.

import { FIGURES, SKIN_TONES, HAIR_COLORS, versioned } from '../config.js';
import { fits, dyeById } from '../world/clothes.js';

const painting = new Map(); // key -> Promise of a picture address
const painted = new Map();  // key -> picture address, once ready

// The figure and colours of an Envoy; unknown or missing values fall back
// to the first of each list. The first colour of each list is the one the
// figure is drawn in. undershirt: whether the figure wears its undershirt
// (only a figure that has one; worn unless switched off in the settings).
export function resolveLook(envoy) {
  const figure = FIGURES.find((x) => x.id === envoy?.figur) || FIGURES[0];
  const skin = SKIN_TONES.find((x) => x.id === envoy?.haut) || SKIN_TONES[0];
  const hair = HAIR_COLORS.find((x) => x.id === envoy?.haar) || HAIR_COLORS[0];
  return {
    figure,
    skin: skin === SKIN_TONES[0] ? { ...skin, rgb: figure.skin } : skin,
    hair: hair === HAIR_COLORS[0] ? { ...hair, rgb: figure.hair } : hair,
    undershirt: Boolean(figure.undershirt) && envoy?.unterhemd !== false,
  };
}

export const baseSrc = (look) => versioned(`${look.figure.folder}/basisfigur.png`);
export const portraitSrc = (look) => versioned(`${look.figure.folder}/portrait.png`);
export const undershirtSrc = (look) => (look.undershirt ? versioned(`${look.figure.folder}/${look.figure.undershirt}`) : null);

// The picture of an item for this figure: its own version if there is one;
// none for a figure the drawing does not fit.
export function layerSrc(item, look) {
  if (!fits(item, look.figure.id)) return null;
  return item.figuren?.[look.figure.id] || item.figur;
}

// The colour of an owned or offered piece, for painting: null when it is as
// drawn. In shoes and gloves the skin (feet, fingertips) keeps its colour.
export function dyeOf(farbe, item) {
  const dye = dyeById(farbe);
  return dye ? { ...dye, keepSkin: item?.slot === 'schuhe' || item?.slot === 'handschuhe' } : null;
}

// The same for the icon of an item.
export function iconSrc(item, look) {
  return item.icons?.[look.figure.id] || item.icon;
}

// The drawing a dyed icon is cut from: the layer for this figure, or any.
export function iconLayerSrc(item, look) {
  return layerSrc(item, look) || item.figur || Object.values(item.figuren || {})[0] || null;
}

const same = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

// Shows a layer in an <img>. Painted first when the colours differ from
// the drawing; until then the layer stays invisible.
// kind: 'base' (the figure: skin and hair), 'portrait' (the same, with the
// portrait's hair zone), 'exercise' (the same, hair anywhere), 'layer'
// (clothing: only visible skin) or 'icon' (the icon of a dyed piece, cut
// from its layer: src is the layer). dye: see dyeOf.
export function showLayer(img, src, look, kind = 'layer', dye = null) {
  const withHair = kind !== 'layer' && kind !== 'icon';
  const skinChanged = kind !== 'icon' && !same(look.skin.rgb, look.figure.skin);
  const hairChanged = withHair && !same(look.hair.rgb, look.figure.hair);
  if (!skinChanged && !hairChanged && !dye) {
    img.src = src;
    return;
  }
  const key = `${kind}|${src}|${skinChanged ? look.skin.id : ''}|${withHair ? look.hair.id : ''}|${dye ? dye.id : ''}`;
  if (painted.has(key)) {
    img.src = painted.get(key);
    return;
  }
  if (!painting.has(key)) painting.set(key, paint(src, look, kind, dye, skinChanged).then((url) => { painted.set(key, url); return url; }));
  img.style.visibility = 'hidden';
  painting.get(key)
    .then((url) => { img.src = url; })
    .catch(() => { img.src = src; })
    .finally(() => { img.style.visibility = ''; });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function paint(src, look, kind, dye, skinChanged) {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  if (kind === 'base') paintFigure(pixels, look, look.figure.hairZone);
  else if (kind === 'portrait') paintFigure(pixels, look, look.figure.portraitHairZone);
  else if (kind === 'exercise') paintFigure(pixels, look, 1);
  else {
    // shoes and gloves show skin: what looks like the figure underneath stays
    const under = dye?.keepSkin ? await basePixels(look, canvas.width, canvas.height) : null;
    if (dye) dyeLayer(pixels, dye, under);
    if (skinChanged) paintSkinInLayer(pixels, look);
  }
  context.putImageData(pixels, 0, 0);
  const out = kind === 'icon' ? iconOf(canvas, pixels) : canvas;
  const blob = await new Promise((resolve) => out.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('paint');
  return URL.createObjectURL(blob);
}

// How much each channel changes: chosen colour ÷ drawn colour.
const factors = (chosen, drawn) => chosen.map((v, c) => v / drawn[c]);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function hueOf(r, g, b, max, min) {
  const d = max - min;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

function paintFigure({ data, width, height }, look, hairZone) {
  const { figure } = look;
  const skin = factors(look.skin.rgb, figure.skin);
  const hair = factors(look.hair.rgb, figure.hair);
  const hairEnd = Math.round(height * hairZone) * width * 4;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max < 20 || max - min < 0.12 * max) continue; // black lines, greys and whites stay
    const hue = hueOf(r, g, b, max, min);
    if (hue < 5 || hue > 60) continue;                 // neither skin nor hair
    const w = i < hairEnd ? clamp01((hue - 29) / 5) : 0; // share of hair
    for (let c = 0; c < 3; c += 1) {
      data[i + c] = Math.min(255, data[i + c] * ((1 - w) * skin[c] + w * hair[c]));
    }
  }
}

function paintSkinInLayer({ data }, look) {
  const { figure } = look;
  const skin = factors(look.skin.rgb, figure.skin);
  // the tint of the drawn skin, independent of light and shadow
  const rg = figure.skin[0] / figure.skin[1];
  const gb = figure.skin[1] / figure.skin[2];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (Math.max(r, g, b) < 25 || g === 0 || b === 0) continue;
    if (Math.abs(r / g - rg) > 0.1 || Math.abs(g / b - gb) > 0.12) continue;
    for (let c = 0; c < 3; c += 1) data[i + c] = Math.min(255, data[i + c] * skin[c]);
  }
}

// The pixels of the figure itself, the same size as its layers (kept).
const bases = new Map();
function basePixels(look, width, height) {
  const key = `${look.figure.id}|${width}`;
  if (!bases.has(key)) {
    bases.set(key, loadImage(baseSrc(look)).then((image) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0, width, height);
      return context.getImageData(0, 0, width, height).data;
    }).catch(() => null));
  }
  return bases.get(key);
}

// The icon of a dyed piece: cut from its dyed layer the way the icons are
// made (tools: the drawing, a little margin, 256 × 256).
const ICON_SIZE = 256;
function iconOf(canvas, { data, width, height }) {
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] <= 13) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  const icon = document.createElement('canvas');
  icon.width = ICON_SIZE;
  icon.height = ICON_SIZE;
  if (x1 < 0) return icon;
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const side = Math.max(w, h) * 1.12;
  const scale = ICON_SIZE / side;
  const context = icon.getContext('2d');
  context.imageSmoothingQuality = 'high';
  context.drawImage(canvas, x0, y0, w, h, (ICON_SIZE - w * scale) / 2, (ICON_SIZE - h * scale) / 2, w * scale, h * scale);
  return icon;
}

// --- colours of clothing ------------------------------------------------------
// Dyeing keeps the drawing: its shading, its pattern, its lines. A colourful
// piece turns all its hues together, so that its main hue becomes the hue of
// the colour, and its saturation moves towards the colour's; a piece without
// much colour (white, grey, a light tint) takes the colour's hue everywhere.
// Between the two, both are mixed by how colourful the piece is. Lightness
// moves so that its average becomes the colour's. Black lines stay black; in
// shoes and gloves the skin stays (what looks like the figure underneath).

function hsl(r, g, b) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  return [hueOf(r, g, b, Math.max(r, g, b), Math.min(r, g, b)), Math.min(1, s), l];
}

function rgbOf(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r, g, b] = hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  const m = l - c / 2;
  return [r + m, g + m, b + m].map((v) => Math.round(clamp01(v) * 255));
}

// Is this pixel skin (of any figure, in light or shadow)?
function isSkin(r, g, b) {
  if (Math.max(r, g, b) < 25 || g === 0 || b === 0) return false;
  return FIGURES.some(({ skin }) => Math.abs(r / g - skin[0] / skin[1]) <= 0.1 && Math.abs(g / b - skin[1] / skin[2]) <= 0.12);
}

const PLAIN_UP_TO = 0.08;     // mean colourfulness (max − min) of a plain piece
const COLOURFUL_FROM = 0.18;  // … and of a colourful one

function dyeLayer({ data }, dye, under) {
  const [hd, sd, ld] = hsl(...dye.rgb);
  // the lines: darker than half the average lightness, at most 0.13
  let sumL = 0;
  let sumA = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 13) continue;
    const l = (Math.max(data[i], data[i + 1], data[i + 2]) + Math.min(data[i], data[i + 1], data[i + 2])) / 510;
    if (l > 0.08) { sumL += l * a; sumA += a; }
  }
  if (sumA === 0) return;
  const lineL = Math.min(0.13, (sumL / sumA) * 0.5);
  const likeUnder = (i) => under && under[i + 3] > 128
    && Math.abs(data[i] - under[i]) + Math.abs(data[i + 1] - under[i + 1]) + Math.abs(data[i + 2] - under[i + 2]) < 60;
  const skip = (i, l) => data[i + 3] < 13 || l < lineL
    || (dye.keepSkin && (likeUnder(i) || isSkin(data[i], data[i + 1], data[i + 2])));
  // averages of the cloth: saturation, lightness, main hue (weighted by saturation)
  let w = 0;
  let ws = 0;
  let wl = 0;
  let wc = 0;
  let hx = 0;
  let hy = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = hsl(data[i], data[i + 1], data[i + 2]);
    if (skip(i, l)) continue;
    const a = data[i + 3];
    w += a;
    ws += s * a;
    wl += l * a;
    wc += ((Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2])) / 255) * a;
    hx += Math.cos((h * Math.PI) / 180) * s * a;
    hy += Math.sin((h * Math.PI) / 180) * s * a;
  }
  if (w === 0) return;
  const meanS = ws / w;
  const meanL = Math.min(0.98, Math.max(0.02, wl / w));
  const mainH = (Math.atan2(hy, hx) * 180) / Math.PI;
  // the lightness of the dye (a little of the drawing's own kept), the
  // shading of the drawing kept around it
  const target = ld * 0.8 + meanL * 0.2;
  const shade = (l) => (target <= meanL
    ? target * (l / meanL) ** 0.9
    : 1 - (1 - target) * ((1 - l) / (1 - meanL)) ** 0.9);
  // how much the piece keeps its own hues: 0 plain … 1 colourful
  const own = clamp01((wc / w - PLAIN_UP_TO) / (COLOURFUL_FROM - PLAIN_UP_TO));
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = hsl(data[i], data[i + 1], data[i + 2]);
    if (skip(i, l)) continue;
    const nl = clamp01(shade(clamp01(l)));
    const plain = rgbOf(hd, clamp01(sd * (0.75 + s)), nl);
    const turned = own > 0 ? rgbOf((((h + hd - mainH) % 360) + 360) % 360, clamp01((s * sd) / Math.max(meanS, 0.01)), nl) : plain;
    data[i] = Math.round(plain[0] + (turned[0] - plain[0]) * own);
    data[i + 1] = Math.round(plain[1] + (turned[1] - plain[1]) * own);
    data[i + 2] = Math.round(plain[2] + (turned[2] - plain[2]) * own);
  }
}
