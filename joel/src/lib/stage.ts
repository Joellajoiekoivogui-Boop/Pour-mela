// L'état partagé hors de React, lu à chaque image par les canevas :
// la souris, le défilement, le chapitre en cours, la qualité. Les
// composants y écrivent sans provoquer de nouveau rendu.

import { SERVER_QUALITY, type Quality } from "./quality";

export interface Palette {
  /** Couleur principale des particules (r, g, b). */
  a: [number, number, number];
  /** Couleur secondaire. */
  b: [number, number, number];
}

export const PALETTES: Record<string, Palette> = {
  accueil: { a: [196, 181, 253], b: [255, 255, 255] },
  "compte-a-rebours": { a: [147, 197, 253], b: [167, 139, 250] },
  "nouvelle-annee": { a: [167, 139, 250], b: [244, 171, 210] },
  parcours: { a: [129, 140, 248], b: [196, 181, 253] },
  ambitions: { a: [167, 139, 250], b: [125, 211, 252] },
  souvenirs: { a: [244, 171, 210], b: [196, 181, 253] },
  message: { a: [255, 255, 255], b: [196, 181, 253] },
  celebration: { a: [216, 180, 254], b: [251, 207, 232] },
};

export const stage = {
  quality: SERVER_QUALITY as Quality,
  /** Souris en pixels ; actif = vue récemment. */
  pointer: { x: -9999, y: -9999, nx: 0, ny: 0, active: false },
  /** Vitesse de défilement lissée (px par image). */
  scrollVelocity: 0,
  chapter: "accueil",
  /** 0 → 1 : allumage de l'univers pendant l'introduction. */
  ignition: 0,
  /** Fête en cours (fond plus vif, particules plus rapides). */
  party: 0,
  secretMode: false,
};

export function initStage(quality: Quality) {
  stage.quality = quality;
  const onMove = (event: PointerEvent) => {
    stage.pointer.x = event.clientX;
    stage.pointer.y = event.clientY;
    stage.pointer.nx = (event.clientX / window.innerWidth) * 2 - 1;
    stage.pointer.ny = (event.clientY / window.innerHeight) * 2 - 1;
    stage.pointer.active = true;
  };
  const onLeave = () => {
    stage.pointer.active = false;
    stage.pointer.x = stage.pointer.y = -9999;
  };
  let last = window.scrollY;
  let raf = 0;
  const tick = () => {
    const y = window.scrollY;
    stage.scrollVelocity += (y - last - stage.scrollVelocity) * 0.15;
    last = y;
    raf = requestAnimationFrame(tick);
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
  raf = requestAnimationFrame(tick);
  return () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    cancelAnimationFrame(raf);
  };
}
