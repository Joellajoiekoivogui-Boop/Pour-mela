// Le « réalisateur » : un petit état partagé, hors de React, entre les
// sections (DOM) et la scène WebGL. Les composants y écrivent (scène
// courante, pointeur, demandes d'étincelles) et la boucle de rendu le lit
// à chaque image, sans provoquer de rendu React.

import { detectQuality, SERVER_QUALITY, type Quality } from "./quality";

export type SceneKey = "void" | "sky" | "name" | "crown" | "galaxy" | "play" | "heart" | "finale";

/** Poids des formes vers lesquelles les particules convergent. */
export type ShapeWeights = readonly [sky: number, name: number, crown: number, galaxy: number, heart: number];

export interface SceneSpec {
  shape: ShapeWeights;
  brightness: number;
  petals: number;
  /** Force de répulsion autour du doigt / de la souris. */
  pointer: number;
  /** Vitesse de rotation des formes (rad/s). */
  spin: number;
}

export const SCENES: Record<SceneKey, SceneSpec> = {
  void: { shape: [1, 0, 0, 0, 0], brightness: 0.4, petals: 0, pointer: 0.7, spin: 0.08 },
  sky: { shape: [1, 0, 0, 0, 0], brightness: 0.85, petals: 0, pointer: 0.9, spin: 0.08 },
  name: { shape: [0, 1, 0, 0, 0], brightness: 1, petals: 0.22, pointer: 0.75, spin: 0.08 },
  crown: { shape: [0, 0, 1, 0, 0], brightness: 1, petals: 0.3, pointer: 0.8, spin: 0.32 },
  galaxy: { shape: [0, 0, 0, 1, 0], brightness: 0.95, petals: 0.06, pointer: 0.9, spin: 0.05 },
  play: { shape: [1, 0, 0, 0, 0], brightness: 1, petals: 0.12, pointer: 2.2, spin: 0.08 },
  heart: { shape: [0, 0, 0, 0, 1], brightness: 1, petals: 0.3, pointer: 0.9, spin: 0.22 },
  finale: { shape: [0, 1, 0, 0, 0], brightness: 1.15, petals: 1, pointer: 0.8, spin: 0.08 },
};

export type SparkKind = "hearts" | "stars" | "dust" | "trail" | "ring" | "firework" | "gold";

export interface SparkRequest {
  /** Position en pixels écran (ou en unités du monde si `world`). */
  x: number;
  y: number;
  world?: boolean;
  kind: SparkKind;
  /** Multiplicateur de quantité. */
  amount?: number;
  /** Vitesse du geste (px/s), pour orienter les traînées. */
  vx?: number;
  vy?: number;
}

type Listener = () => void;

const listeners = new Set<Listener>();

export const director = {
  quality: SERVER_QUALITY as Quality,
  ready: false,
  /** La scène WebGL tourne (sinon : repli statique). */
  glActive: false,

  scene: "void" as SceneKey,
  sceneVersion: 0,
  /** Élément du DOM auquel la forme est accrochée (elle suit le défilement). */
  anchor: null as HTMLElement | null,
  /** Inclinaison de la galaxie (rad), pilotée par le défilement. */
  galaxyTilt: 1.15,

  pointer: { x: 0, y: 0, nx: 0, ny: 0, vx: 0, vy: 0, active: false, lastMove: 0 },
  tilt: { x: 0, y: 0 },

  /** Impulsion musicale (0..1) : chaque accent fait battre la lumière. */
  beat: 0,
  /** Explosion ponctuelle des formes. */
  impulse: 0,
  /** Saut en « vitesse lumière » (0..1). */
  warp: 0,
  /** Vitesse de défilement (px/s) : les étoiles défilent avec la page. */
  scrollVelocity: 0,

  sparks: [] as SparkRequest[],
  stats: { lights: 0, sparks: 0 },

  init() {
    if (this.ready || typeof window === "undefined") return;
    this.quality = detectQuality();
    this.ready = true;
    document.documentElement.dataset.tier = this.quality.tier;
    if (this.quality.reducedMotion) document.documentElement.dataset.motion = "reduite";
    notify();
  },

  setScene(scene: SceneKey, anchor: HTMLElement | null = null) {
    if (this.scene === scene && this.anchor === anchor) return;
    this.scene = scene;
    this.anchor = anchor;
    this.sceneVersion++;
    document.documentElement.dataset.scene = scene;
    notify();
  },

  emit(request: SparkRequest) {
    if (!this.glActive) return;
    if (this.sparks.length > 400) this.sparks.shift();
    this.sparks.push(request);
  },

  explode(strength = 1) {
    this.impulse = Math.max(this.impulse, strength);
  },

  pulse(strength = 1) {
    this.beat = Math.max(this.beat, strength);
  },

  setGlActive(active: boolean) {
    this.glActive = active;
    notify();
  },
};

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
