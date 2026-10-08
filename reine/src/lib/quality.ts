// Détection des capacités de l'appareil : le nombre de particules, la
// densité de pixels et les effets s'adaptent pour rester fluides.
// Forçage possible par l'adresse : ?qualite=haute|moyenne|basse et
// ?animations=reduites.

export type Tier = "low" | "mid" | "high";

export interface Quality {
  tier: Tier;
  reducedMotion: boolean;
  webgl: boolean;
  touch: boolean;
  /** Particules du nuage principal (étoiles, prénom, couronne, cœur…). */
  particles: number;
  /** Pétales de rose instanciés. */
  petals: number;
  /** Emplacements du système d'étincelles (cœurs, étoiles, feux d'artifice). */
  sparks: number;
  /** Traînées lumineuses de la transition « vitesse lumière ». */
  streaks: number;
  /** Densité de pixels maximale du rendu WebGL. */
  dpr: number;
}

const BUDGETS: Record<Tier, Omit<Quality, "tier" | "reducedMotion" | "webgl" | "touch" | "dpr">> = {
  high: { particles: 72000, petals: 220, sparks: 8192, streaks: 640 },
  mid: { particles: 30000, petals: 120, sparks: 4096, streaks: 380 },
  low: { particles: 11000, petals: 48, sparks: 2048, streaks: 200 },
};

const WEAK_GPU = /(mali-4|mali-t[67]|adreno \(tm\) [345]\d\d|powervr sgx|powervr rogue g6|swiftshader|llvmpipe|softpipe|mesa offscreen|apple gpu \(software\))/i;

interface NavigatorExtras {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

function probeWebGL(): { ok: boolean; renderer: string } {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") || canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return { ok: false, renderer: "" };
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return { ok: true, renderer };
  } catch {
    return { ok: false, renderer: "" };
  }
}

export function detectQuality(): Quality {
  const params = new URLSearchParams(window.location.search);
  const nav = navigator as Navigator & NavigatorExtras;
  const reducedMotion =
    params.get("animations") === "reduites" ||
    (params.get("animations") !== "completes" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const touch = coarse || navigator.maxTouchPoints > 0;
  const { ok: webgl, renderer } = probeWebGL();

  const cores = navigator.hardwareConcurrency || 4;
  const memory = nav.deviceMemory ?? 4;
  const saveData = Boolean(nav.connection?.saveData);
  const smallScreen = Math.min(window.screen.width, window.screen.height) < 500;

  let tier: Tier;
  if (WEAK_GPU.test(renderer) || saveData || memory <= 2 || cores <= 2) tier = "low";
  // Safari ne dit ni la mémoire ni le vrai nombre de cœurs : sur iPhone,
  // on se fie à la puce graphique Apple, toujours capable.
  else if (coarse || smallScreen) tier = (cores >= 6 && memory >= 4) || /apple gpu/i.test(renderer) ? "mid" : "low";
  else tier = cores >= 6 && memory >= 6 ? "high" : "mid";

  const forced = params.get("qualite");
  if (forced === "haute") tier = "high";
  else if (forced === "moyenne") tier = "mid";
  else if (forced === "basse") tier = "low";

  const deviceDpr = window.devicePixelRatio || 1;
  const dprCap = tier === "high" ? 2 : tier === "mid" ? 1.6 : 1.15;

  return {
    tier,
    reducedMotion,
    webgl,
    touch,
    dpr: Math.min(deviceDpr, dprCap),
    ...BUDGETS[tier],
  };
}

export const SERVER_QUALITY: Quality = {
  tier: "mid",
  reducedMotion: false,
  webgl: false,
  touch: false,
  dpr: 1,
  ...BUDGETS.mid,
};
