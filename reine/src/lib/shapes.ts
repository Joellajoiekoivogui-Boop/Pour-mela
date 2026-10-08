// Les formes que prennent les particules. Chaque fonction remplit un tableau
// [x, y, z, x, y, z…] de `count` points. Chaque point choisit sa partie de la
// forme au hasard : si l'appareil peine et qu'on n'affiche qu'une partie des
// particules, la forme reste complète, juste moins dense.

import { createRandom, gaussian } from "./random.ts";

/** Caméra de la scène : les formes sont calculées pour elle. */
export const CAMERA_Z = 10;
export const CAMERA_FOV = 50;
export const TAN_HALF_FOV = Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180);

/** Profondeur du ciel : de SKY_NEAR (près de la caméra) à SKY_FAR. */
export const SKY_NEAR = 4;
export const SKY_FAR = -26;

/** Ciel étoilé en forme de pyramide de vision : rien n'est gaspillé hors champ. */
export function skyShape(count: number, aspect: number, seed = 11): Float32Array {
  const random = createRandom(seed);
  const out = new Float32Array(count * 3);
  const depth = SKY_NEAR - SKY_FAR;
  for (let i = 0; i < count; i++) {
    const z = SKY_FAR + depth * Math.pow(random(), 0.75);
    const halfH = TAN_HALF_FOV * (CAMERA_Z - z) * 1.15;
    const halfW = halfH * aspect + 0.6;
    out[i * 3] = (random() * 2 - 1) * halfW;
    out[i * 3 + 1] = (random() * 2 - 1) * halfH;
    out[i * 3 + 2] = z;
  }
  return out;
}

const CROWN_SPIKES = 7;
const CROWN_JEWELS = 14;
const BAND_LOW = -0.45;
const BAND_HIGH = -0.1;
const SPIKE_HEIGHT = 0.85;

function spikeProfile(theta: number): number {
  return Math.pow(Math.abs(Math.cos((theta * CROWN_SPIKES) / 2)), 2.4);
}

/** Couronne à sept pointes, perles et joyaux (rayon 1, centrée). */
export function crownShape(count: number, seed = 23): Float32Array {
  const random = createRandom(seed);
  const out = new Float32Array(count * 3);
  const centerY = (BAND_LOW + BAND_HIGH + SPIKE_HEIGHT + 0.1) / 2;
  const radiusAt = (y: number) => 0.92 + 0.12 * ((y - BAND_LOW) / (BAND_HIGH + SPIKE_HEIGHT - BAND_LOW));

  for (let i = 0; i < count; i++) {
    const part = random();
    let x: number;
    let y: number;
    let z: number;
    if (part < 0.5) {
      // Paroi : du bandeau jusqu'au bord des pointes.
      const theta = random() * Math.PI * 2;
      const top = BAND_HIGH + SPIKE_HEIGHT * spikeProfile(theta);
      y = BAND_LOW + random() * (top - BAND_LOW);
      const r = radiusAt(y) + gaussian(random) * 0.008;
      x = Math.cos(theta) * r;
      z = Math.sin(theta) * r;
    } else if (part < 0.64) {
      // Liseré lumineux le long des pointes.
      const theta = random() * Math.PI * 2;
      y = BAND_HIGH + SPIKE_HEIGHT * spikeProfile(theta) + gaussian(random) * 0.01;
      const r = radiusAt(y);
      x = Math.cos(theta) * r;
      z = Math.sin(theta) * r;
    } else if (part < 0.76) {
      // Les deux anneaux du bandeau.
      const theta = random() * Math.PI * 2;
      y = (random() < 0.5 ? BAND_LOW : BAND_HIGH) + gaussian(random) * 0.012;
      const r = radiusAt(y) + 0.015;
      x = Math.cos(theta) * r;
      z = Math.sin(theta) * r;
    } else if (part < 0.88) {
      // Perles au bout des pointes.
      const k = Math.floor(random() * CROWN_SPIKES);
      const theta = (k * Math.PI * 2) / CROWN_SPIKES;
      const tipY = BAND_HIGH + SPIKE_HEIGHT + 0.08;
      const r = radiusAt(tipY - 0.08);
      x = Math.cos(theta) * r + gaussian(random) * 0.045;
      y = tipY + gaussian(random) * 0.045;
      z = Math.sin(theta) * r + gaussian(random) * 0.045;
    } else {
      // Joyaux sertis dans le bandeau.
      const k = Math.floor(random() * CROWN_JEWELS);
      const theta = ((k + 0.5) * Math.PI * 2) / CROWN_JEWELS;
      const jewelY = (BAND_LOW + BAND_HIGH) / 2;
      const r = radiusAt(jewelY) + 0.03;
      x = Math.cos(theta) * r + gaussian(random) * 0.03;
      y = jewelY + gaussian(random) * 0.03;
      z = Math.sin(theta) * r + gaussian(random) * 0.03;
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y - centerY;
    out[i * 3 + 2] = z;
  }
  return out;
}

const heartX = (t: number) => (16 * Math.pow(Math.sin(t), 3)) / 16;
const heartY = (t: number) => (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 2.5) / 16;

/** Contour du cœur en polygone, pour savoir si un point est à l'intérieur. */
const HEART_OUTLINE: [number, number][] = Array.from({ length: 240 }, (_, i) => {
  const t = (i / 240) * Math.PI * 2;
  return [heartX(t), heartY(t)];
});

function insideHeart(x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = HEART_OUTLINE.length - 1; i < HEART_OUTLINE.length; j = i++) {
    const [xi, yi] = HEART_OUTLINE[i];
    const [xj, yj] = HEART_OUTLINE[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Cœur en relief : un contour net et un volume doux (largeur 2). */
export function heartShape(count: number, seed = 37): Float32Array {
  const random = createRandom(seed);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    let x: number;
    let y: number;
    let z: number;
    if (random() < 0.4) {
      const t = random() * Math.PI * 2;
      x = heartX(t) + gaussian(random) * 0.008;
      y = heartY(t) + gaussian(random) * 0.008;
      z = gaussian(random) * 0.03;
    } else {
      // Remplissage uniforme : tirage au hasard jusqu'à tomber dans le cœur.
      do {
        x = random() * 2 - 1;
        y = random() * 2 - 1;
      } while (!insideHeart(x, y));
      const edge = Math.min(1, Math.hypot(x, y - 0.1));
      z = (random() * 2 - 1) * 0.38 * Math.sqrt(Math.max(0, 1 - edge * edge * 0.92));
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}

const GALAXY_ARMS = 3;
export const GALAXY_RADIUS = 3;

/** Galaxie spirale à trois bras, bulbe lumineux et halo (rayon 3). */
export function galaxyShape(count: number, seed = 53): Float32Array {
  const random = createRandom(seed);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const part = random();
    let x: number;
    let y: number;
    let z: number;
    if (part < 0.13) {
      x = gaussian(random) * 0.32;
      y = gaussian(random) * 0.2;
      z = gaussian(random) * 0.32;
    } else if (part < 0.2) {
      const theta = random() * Math.PI * 2;
      const r = Math.sqrt(random()) * GALAXY_RADIUS * 1.15;
      x = Math.cos(theta) * r;
      y = gaussian(random) * 0.3;
      z = Math.sin(theta) * r;
    } else {
      const d = Math.pow(random(), 0.6) * GALAXY_RADIUS;
      const arm = Math.floor(random() * GALAXY_ARMS);
      const angle = (arm * Math.PI * 2) / GALAXY_ARMS + d * 1.35 + gaussian(random) * 0.2;
      const spread = 0.08 + d * 0.05;
      x = Math.cos(angle) * d + gaussian(random) * spread;
      y = gaussian(random) * 0.05 * (1.3 - d / GALAXY_RADIUS);
      z = Math.sin(angle) * d + gaussian(random) * spread;
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}

/** Quatre valeurs aléatoires par particule (taille, couleur, rythme…). */
export function seeds(count: number, seed = 71): Float32Array {
  const random = createRandom(seed);
  const out = new Float32Array(count * 4);
  for (let i = 0; i < out.length; i++) out[i] = random();
  return out;
}

export interface TextShape {
  positions: Float32Array;
  /** Hauteur / largeur du texte, pour l'ajuster à l'écran. */
  ratio: number;
}

/**
 * Le prénom, échantillonné depuis un canvas : chaque particule tombe sur
 * un pixel du tracé. Largeur normalisée à 1.
 */
export function textShape(count: number, text: string, fontFamily: string, seed = 89): TextShape | null {
  const width = 1400;
  const height = 620;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  let fontSize = 360;
  ctx.font = `${fontSize}px ${fontFamily}`;
  const measured = ctx.measureText(text).width;
  if (measured > width * 0.86) fontSize *= (width * 0.86) / measured;
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = fontSize * 0.014;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2);
  ctx.strokeText(text, width / 2, height / 2);

  const data = ctx.getImageData(0, 0, width, height).data;
  const xs: number[] = [];
  const ys: number[] = [];
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > 110) {
        xs.push(x);
        ys.push(y);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (xs.length < 50) return null;

  const random = createRandom(seed);
  const inkWidth = Math.max(1, maxX - minX);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const k = Math.floor(random() * xs.length);
    positions[i * 3] = (xs[k] + random() - cx) / inkWidth;
    positions[i * 3 + 1] = -(ys[k] + random() - cy) / inkWidth;
    positions[i * 3 + 2] = (random() - 0.5) * 0.04;
  }
  return { positions, ratio: (maxY - minY) / inkWidth };
}

export interface PortraitShape {
  positions: Float32Array;
  colors: Float32Array;
  /** Hauteur / largeur du portrait. */
  ratio: number;
}

const PORTRAIT_GOLD = [1, 0.8, 0.5] as const;

/**
 * Son visage en mosaïque de lumière : la photo est réduite en une grille,
 * chaque particule prend la place et la couleur (rehaussée, dorée) d'une
 * case, dans un ovale qui s'estompe sur les bords. Largeur normalisée à 1.
 */
export function portraitShape(
  count: number,
  image: HTMLImageElement,
  centre: readonly [number, number],
  taille: number,
  seed = 101,
): PortraitShape | null {
  const ratio = 1.15;
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const cropW = Math.min(width, taille * width);
  const cropH = cropW * ratio;
  const sx = Math.max(0, Math.min(width - cropW, (centre[0] / 100) * width - cropW / 2));
  const sy = Math.max(0, Math.min(height - cropH, (centre[1] / 100) * height - cropH / 2));

  // Environ deux particules par case dans l'ovale.
  const gw = Math.max(40, Math.round(Math.sqrt((count * 0.55) / 0.785 / ratio)));
  const gh = Math.round(gw * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = gw;
  canvas.height = gh;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(image, sx, sy, cropW, cropH, 0, 0, gw, gh);
  const data = ctx.getImageData(0, 0, gw, gh).data;

  // Contraste automatique sur la luminosité (2 % – 98 %).
  const lums: number[] = [];
  for (let i = 0; i < gw * gh; i++) lums.push(0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]);
  const sorted = [...lums].sort((a, b) => a - b);
  const low = sorted[Math.floor(sorted.length * 0.02)];
  const high = Math.max(low + 1, sorted[Math.floor(sorted.length * 0.98)]);
  const lift = (v: number) => Math.pow(Math.max(0, Math.min(1, (v - low) / (high - low))), 0.75);

  const cells: { x: number; y: number; r: number; g: number; b: number }[] = [];
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const d = ((x + 0.5 - gw / 2) / (gw / 2)) ** 2 + ((y + 0.5 - gh / 2) / (gh / 2)) ** 2;
      if (d >= 1) continue;
      const mask = Math.min(1, (1 - d) / 0.3) * 1.15;
      const i = (y * gw + x) * 4;
      const lum = lift(lums[y * gw + x]);
      const [r, g, b] = [lift(data[i]), lift(data[i + 1]), lift(data[i + 2])];
      cells.push({
        x,
        y,
        r: (r * 0.65 + lum * PORTRAIT_GOLD[0] * 0.35) * mask,
        g: (g * 0.65 + lum * PORTRAIT_GOLD[1] * 0.35) * mask,
        b: (b * 0.65 + lum * PORTRAIT_GOLD[2] * 0.35) * mask,
      });
    }
  }
  if (!cells.length) return null;

  // Ordre mélangé : si l'appareil n'affiche qu'une partie des particules,
  // tout le visage reste dessiné, simplement moins dense.
  const random = createRandom(seed);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const cell = cells[i % cells.length];
    positions[i * 3] = (cell.x + 0.2 + random() * 0.6) / gw - 0.5;
    positions[i * 3 + 1] = -((cell.y + 0.2 + random() * 0.6) / gw - ratio / 2);
    positions[i * 3 + 2] = (random() - 0.5) * 0.03;
    colors[i * 3] = cell.r;
    colors[i * 3 + 1] = cell.g;
    colors[i * 3 + 2] = cell.b;
  }
  return { positions, colors, ratio };
}
