// Petits services de l'appareil : vibration et inclinaison du téléphone.

import { director } from "./director";

export function vibrate(pattern: number | number[]) {
  if (!director.quality.touch || director.quality.reducedMotion) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* non disponible (iOS) */
  }
}

type PermissionRequester = { requestPermission?: () => Promise<"granted" | "denied"> };

let listening = false;
let base: { gamma: number; beta: number } | null = null;

function onOrientation(event: DeviceOrientationEvent) {
  if (event.gamma == null || event.beta == null) return;
  if (!base) base = { gamma: event.gamma, beta: event.beta };
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));
  director.tilt.x = clamp((event.gamma - base.gamma) / 28);
  director.tilt.y = clamp((event.beta - base.beta) / 28);
}

function listen() {
  if (listening) return;
  listening = true;
  window.addEventListener("deviceorientation", onOrientation, { passive: true });
}

export function tiltNeedsPermission(): boolean {
  if (typeof window === "undefined" || typeof DeviceOrientationEvent === "undefined") return false;
  return typeof (DeviceOrientationEvent as unknown as PermissionRequester).requestPermission === "function";
}

export function tiltActive(): boolean {
  return listening;
}

/**
 * Active la parallaxe à l'inclinaison. Sur iPhone, l'autorisation doit être
 * demandée pendant un geste : on l'appelle au clic d'entrée.
 */
export async function enableTilt(): Promise<boolean> {
  if (typeof DeviceOrientationEvent === "undefined" || !director.quality.touch || director.quality.reducedMotion) return false;
  const requester = DeviceOrientationEvent as unknown as PermissionRequester;
  if (typeof requester.requestPermission === "function") {
    try {
      if ((await requester.requestPermission()) !== "granted") return false;
    } catch {
      return false;
    }
  }
  listen();
  return true;
}
