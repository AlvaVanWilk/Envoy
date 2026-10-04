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

import { FIGURES, SKIN_TONES, HAIR_COLORS, versioned } from '../config.js';

const painting = new Map(); // key -> Promise of a picture address
const painted = new Map();  // key -> picture address, once ready

// The figure and colours of an Envoy; unknown or missing values fall back
// to the first of each list. The first colour of each list is the one the
// figure is drawn in.
export function resolveLook(envoy) {
  const figure = FIGURES.find((x) => x.id === envoy?.figur) || FIGURES[0];
  const skin = SKIN_TONES.find((x) => x.id === envoy?.haut) || SKIN_TONES[0];
  const hair = HAIR_COLORS.find((x) => x.id === envoy?.haar) || HAIR_COLORS[0];
  return {
    figure,
    skin: skin === SKIN_TONES[0] ? { ...skin, rgb: figure.skin } : skin,
    hair: hair === HAIR_COLORS[0] ? { ...hair, rgb: figure.hair } : hair,
  };
}

export const baseSrc = (look) => versioned(`${look.figure.folder}/basisfigur.png`);
export const portraitSrc = (look) => versioned(`${look.figure.folder}/portrait.png`);

// The picture of an item for this figure: its own version if there is one.
export function layerSrc(item, look) {
  return item.figuren?.[look.figure.id] || item.figur;
}

// The same for the icon of an item.
export function iconSrc(item, look) {
  return item.icons?.[look.figure.id] || item.icon;
}

const same = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

// Shows a layer in an <img>. Painted first when the colours differ from
// the drawing; until then the layer stays invisible.
// kind: 'base' (the figure: skin and hair), 'portrait' (the same, with the
// portrait's hair zone), 'exercise' (the same, hair anywhere) or 'layer'
// (clothing: only visible skin).
export function showLayer(img, src, look, kind = 'layer') {
  const withHair = kind !== 'layer';
  const skinChanged = !same(look.skin.rgb, look.figure.skin);
  const hairChanged = withHair && !same(look.hair.rgb, look.figure.hair);
  if (!skinChanged && !hairChanged) {
    img.src = src;
    return;
  }
  const key = `${src}|${look.skin.id}|${withHair ? look.hair.id : ''}`;
  if (painted.has(key)) {
    img.src = painted.get(key);
    return;
  }
  if (!painting.has(key)) painting.set(key, paint(src, look, kind).then((url) => { painted.set(key, url); return url; }));
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

async function paint(src, look, kind) {
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
  else paintSkinInLayer(pixels, look);
  context.putImageData(pixels, 0, 0);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
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
