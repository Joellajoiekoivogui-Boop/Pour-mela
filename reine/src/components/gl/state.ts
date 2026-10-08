import { CAMERA_Z, TAN_HALF_FOV } from "@/lib/shapes";

// Valeurs animées partagées par les éléments de la scène WebGL. Le pilote
// (Driver) les met à jour en premier à chaque image ; les autres les lisent.
export const glState = {
  time: 0,
  from: [1, 0, 0, 0, 0] as number[],
  to: [1, 0, 0, 0, 0] as number[],
  morph: 1,
  chaos: 0,
  brightness: 0.4,
  petals: 0,
  pointerForce: 0.7,
  spin: 0,
  spinSpeed: 0.08,
  tilt: 1.15,
  offsetY: 0,
  beat: 0,
  audio: 0,
  warp: 0,
  travel: 0,
  skyScroll: 0,
  wind: 0,
  pointer: { x: 0, y: 0, vx: 0, vy: 0 },
  aspect: 1,
  viewW: 1,
  viewH: 2 * TAN_HALF_FOV * CAMERA_Z,
  /** Ajustement des formes à l'écran : prénom, couronne, galaxie, cœur. */
  fit: { text: 3, crown: 1, galaxy: 1, heart: 1.5 },
  textRatio: 0.5,
  /** Part des particules affichées (baisse si l'appareil peine). */
  detail: 1,
};

export function updateViewport(width: number, height: number) {
  const aspect = width / Math.max(1, height);
  const viewH = 2 * TAN_HALF_FOV * CAMERA_Z;
  const viewW = viewH * aspect;
  glState.aspect = aspect;
  glState.viewW = viewW;
  glState.viewH = viewH;
  refit();
}

export function refit() {
  const { viewW, viewH } = glState;
  // La taille du prénom suit son élément d'accroche (voir Driver).
  glState.fit.crown = Math.max(0.85, Math.min(viewW * 0.27, viewH * 0.13));
  glState.fit.galaxy = Math.max(viewW, viewH * 0.8) * 0.3;
  glState.fit.heart = Math.min(viewW * 0.37, viewH * 0.2);
}

/** Lissage indépendant du nombre d'images par seconde. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}
