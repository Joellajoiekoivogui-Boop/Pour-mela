// Ce que l'appareil peut faire : le nombre de particules, la densité de
// pixels et les effets s'adaptent pour rester fluides, même sur un
// téléphone Android moyen. Forçage : ?qualite=haute|moyenne|basse,
// ?animations=reduites.

export type Tier = "low" | "mid" | "high";

export interface Quality {
  tier: Tier;
  reducedMotion: boolean;
  touch: boolean;
  webgl: boolean;
  /** Particules d'ambiance du fond. */
  ambient: number;
  /** Particules qui forment les mots de la fin. */
  finale: number;
  /** Lignes entre particules proches. */
  links: boolean;
  dpr: number;
}

const BUDGET: Record<Tier, Pick<Quality, "ambient" | "finale" | "links">> = {
  high: { ambient: 170, finale: 4200, links: true },
  mid: { ambient: 110, finale: 2600, links: true },
  low: { ambient: 60, finale: 1300, links: false },
};

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}

export function detectQuality(): Quality {
  const params = new URLSearchParams(window.location.search);
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const reducedMotion =
    params.get("animations") === "reduites" || (params.get("animations") !== "completes" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const touch = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = nav.deviceMemory ?? 4;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;

  let tier: Tier;
  if (nav.connection?.saveData || memory <= 2 || cores <= 2) tier = "low";
  else if (touch || small) tier = cores >= 8 && memory >= 6 ? "mid" : "low";
  else tier = cores >= 8 ? "high" : "mid";

  const forced = params.get("qualite");
  if (forced === "haute") tier = "high";
  else if (forced === "moyenne") tier = "mid";
  else if (forced === "basse") tier = "low";

  const cap = tier === "high" ? 2 : tier === "mid" ? 1.5 : 1.25;
  return {
    tier,
    reducedMotion,
    touch,
    webgl: hasWebGL(),
    dpr: Math.min(window.devicePixelRatio || 1, cap),
    ...BUDGET[tier],
    ...(reducedMotion ? { ambient: Math.round(BUDGET[tier].ambient / 2) } : null),
  };
}

export const SERVER_QUALITY: Quality = {
  tier: "mid",
  reducedMotion: false,
  touch: false,
  webgl: false,
  dpr: 1,
  ...BUDGET.mid,
};
