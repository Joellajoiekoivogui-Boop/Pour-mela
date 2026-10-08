import * as THREE from "three";

// Mélange additif qui laisse le canal alpha du canvas à zéro : la lumière
// s'ajoute aux couleurs de la page (les aurores en CSS, derrière) au lieu
// de les masquer.
export const additive = {
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.SrcAlphaFactor,
  blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.ZeroFactor,
  blendDstAlpha: THREE.OneFactor,
} as const;
