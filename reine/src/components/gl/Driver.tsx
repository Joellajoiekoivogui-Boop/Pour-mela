"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { director, SCENES } from "@/lib/director";
import { music } from "@/lib/music";
import { damp, glState, updateViewport } from "./state";

const MORPH_SECONDS = 2.4;
const SHAPE_KEYS = 6;

interface PerfState {
  frames: number;
  elapsed: number;
  warmup: number;
  stable: number;
  dpr: number;
}

/** Largeur du prénom (unités du monde) pour qu'il tienne en largeur et en hauteur. */
function textFitFor(height: number) {
  return Math.min(glState.viewW * 0.84, height / Math.max(0.2, glState.textRatio));
}

// Si l'appareil peine, on allège : moins de particules, puis moins de pixels.
function adapt(state: PerfState, rawDt: number, setDpr: (dpr: number) => void) {
  if (state.warmup > 0 || glState.warp > 0.05) {
    state.warmup -= rawDt;
    state.frames = 0;
    state.elapsed = 0;
    return;
  }
  state.frames++;
  state.elapsed += rawDt;
  if (state.elapsed < 1.5) return;
  const fps = state.frames / state.elapsed;
  state.frames = 0;
  state.elapsed = 0;
  if (fps < 42) {
    state.stable = 0;
    if (glState.detail > 0.4) glState.detail = Math.max(0.4, glState.detail * 0.78);
    else if (state.dpr > 1) {
      state.dpr = Math.max(1, state.dpr - 0.25);
      setDpr(state.dpr);
    }
  } else if (fps > 57) {
    state.stable++;
    if (state.stable >= 3 && glState.detail < 1) glState.detail = Math.min(1, glState.detail * 1.1);
  }
}

/**
 * Le pilote de la scène : il traduit l'état du réalisateur (scène, pointeur,
 * musique, défilement) en valeurs animées, déplace la caméra pour la
 * parallaxe et adapte la qualité si l'appareil ralentit.
 */
export function Driver() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const setDpr = useThree((s) => s.setDpr);
  const seenVersion = useRef(-1);
  const perf = useRef<PerfState>({ frames: 0, elapsed: 0, warmup: 3, stable: 0, dpr: director.quality.dpr });

  useEffect(() => {
    updateViewport(size.width, size.height);
  }, [size.width, size.height]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const reduced = director.quality.reducedMotion;
    glState.time += reduced ? dt * 0.25 : dt;

    // Changement de scène : on repart de la forme actuelle.
    if (director.sceneVersion !== seenVersion.current) {
      const eased = glState.morph * glState.morph * (3 - 2 * glState.morph);
      for (let i = 0; i < SHAPE_KEYS; i++) {
        glState.from[i] = glState.from[i] + (glState.to[i] - glState.from[i]) * eased;
        glState.to[i] = SCENES[director.scene].shape[i];
      }
      glState.morph = seenVersion.current < 0 ? 1 : 0;
      seenVersion.current = director.sceneVersion;
    }
    glState.morph = Math.min(1, glState.morph + dt / MORPH_SECONDS);

    const spec = SCENES[director.scene];
    glState.brightness = damp(glState.brightness, spec.brightness, 1.6, dt);
    glState.petals = damp(glState.petals, reduced ? 0 : spec.petals, 0.9, dt);
    glState.pointerForce = damp(glState.pointerForce, reduced ? 0.3 : spec.pointer, 2, dt);
    glState.spinSpeed = damp(glState.spinSpeed, spec.spin, 1.5, dt);
    glState.spin += glState.spinSpeed * dt * (reduced ? 0.3 : 1);
    glState.tilt = damp(glState.tilt, director.galaxyTilt, 2.2, dt);

    // Énergie : un souffle au milieu de chaque morphing (s'il change de
    // forme), plus les explosions.
    let change = 0;
    for (let i = 0; i < SHAPE_KEYS; i++) change += Math.abs(glState.to[i] - glState.from[i]);
    glState.chaos = Math.sin(Math.PI * glState.morph) * 0.3 * Math.min(1, change / 2) + director.impulse;
    director.impulse *= Math.exp(-dt * 1.5);
    if (director.impulse < 0.002) director.impulse = 0;

    // Musique : battements et niveau sonore.
    glState.beat = Math.max(glState.beat * Math.exp(-dt * 5), director.beat);
    director.beat = 0;
    glState.audio = music.readLevel();

    // Vitesse lumière et défilement de la page.
    glState.warp = damp(glState.warp, director.warp, director.warp > glState.warp ? 2.6 : 1.6, dt);
    const scrollSpeed = Math.min(Math.abs(director.scrollVelocity), 4000);
    glState.travel += dt * (0.12 + glState.warp * 26 + scrollSpeed * 0.0016);
    director.scrollVelocity *= Math.exp(-dt * 4);
    glState.skyScroll = damp(glState.skyScroll, window.scrollY * 0.0035, 5, dt);
    glState.wind = damp(glState.wind, Math.max(-1.5, Math.min(1.5, director.scrollVelocity * -0.0008)), 1.5, dt);

    // La forme suit l'élément du DOM auquel elle est accrochée, et le
    // prénom prend la hauteur de cet élément.
    let targetY = 0;
    let textFit = textFitFor(glState.viewH * 0.27);
    if (director.anchor && director.anchor.isConnected) {
      const rect = director.anchor.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      targetY = (-(centerY - window.innerHeight / 2) / window.innerHeight) * glState.viewH;
      textFit = textFitFor((rect.height / window.innerHeight) * glState.viewH * 0.88);
    }
    glState.offsetY = damp(glState.offsetY, targetY, 7, dt);
    glState.fit.text = damp(glState.fit.text, textFit, 4, dt);

    // Pointeur en coordonnées écran normalisées.
    const p = director.pointer;
    const idle = performance.now() - p.lastMove > 2500;
    const tx = p.active && !idle ? p.nx : 5;
    const ty = p.active && !idle ? p.ny : 5;
    glState.pointer.x = Math.abs(glState.pointer.x - tx) > 3 ? tx : damp(glState.pointer.x, tx, 14, dt);
    glState.pointer.y = Math.abs(glState.pointer.y - ty) > 3 ? ty : damp(glState.pointer.y, ty, 14, dt);
    glState.pointer.vx = damp(glState.pointer.vx, (p.vx / window.innerWidth) * 2, 6, dt);
    glState.pointer.vy = damp(glState.pointer.vy, (-p.vy / window.innerHeight) * 2, 6, dt);

    // Parallaxe de la caméra : souris, inclinaison du téléphone.
    const parallax = reduced ? 0 : 1;
    const camX = ((p.active ? p.nx * 0.35 : 0) + director.tilt.x * 0.55) * parallax;
    const camY = ((p.active ? p.ny * 0.22 : 0) + director.tilt.y * 0.4) * parallax;
    camera.position.x = damp(camera.position.x, camX, 2.2, dt);
    camera.position.y = damp(camera.position.y, camY, 2.2, dt);
    camera.lookAt(0, 0, 0);

    director.stats.lights += Math.round(director.quality.particles * glState.detail);

    adapt(perf.current, rawDt, setDpr);
  }, -1);

  return null;
}
