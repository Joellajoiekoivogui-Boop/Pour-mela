// L'image souvenir de son étoile : dessinée sur un canvas au moment du
// clic (ciel, constellation-couronne, son nom, la date), puis partagée ou
// enregistrée sur le téléphone.

import { reine } from "@/config/reine";
import { CROWN_STARS } from "./constellation";
import { createRandom } from "./random";

const WIDTH = 1080;
const HEIGHT = 1350;

function family(variable: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || fallback;
}

export function todayLabel(date = new Date()) {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha: number) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color.replace("ALPHA", String(alpha)));
  gradient.addColorStop(1, color.replace("ALPHA", "0"));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  glow(ctx, x, y, size * 2.2, "rgba(255,236,190,ALPHA)", 0.55);
  ctx.fillStyle = "#fff8e6";
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.quadraticCurveTo(x, y, x + size, y);
  ctx.quadraticCurveTo(x, y, x, y + size);
  ctx.quadraticCurveTo(x, y, x - size, y);
  ctx.quadraticCurveTo(x, y, x, y - size);
  ctx.fill();
}

export async function drawKeepsake(): Promise<Blob | null> {
  const script = family("--font-great-vibes", "cursive");
  const display = family("--font-cinzel", "serif");
  const serif = family("--font-cormorant", "serif");
  await Promise.all([
    document.fonts.load(`120px ${script}`),
    document.fonts.load(`40px ${display}`),
    document.fonts.load(`italic 40px ${serif}`),
  ]).catch(() => undefined);

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Le ciel.
  const sky = ctx.createRadialGradient(WIDTH / 2, HEIGHT * 0.32, 40, WIDTH / 2, HEIGHT * 0.45, HEIGHT * 0.85);
  sky.addColorStop(0, "#3a1430");
  sky.addColorStop(0.55, "#14060f");
  sky.addColorStop(1, "#050208");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const random = createRandom(2026);
  for (let i = 0; i < 900; i++) {
    const x = random() * WIDTH;
    const y = random() * HEIGHT;
    const r = Math.pow(random(), 6) * 2.6 + 0.5;
    const tint = random();
    ctx.fillStyle = tint < 0.7 ? `rgba(255,246,225,${0.25 + random() * 0.6})` : tint < 0.88 ? "rgba(255,210,122,0.7)" : "rgba(255,155,184,0.7)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // La constellation-couronne.
  const size = 520;
  const ox = (WIDTH - size) / 2;
  const oy = 120;
  const points = CROWN_STARS.map(([x, y]) => [ox + (x / 100) * size, oy + (y / 100) * size] as const);
  ctx.strokeStyle = "rgba(246,227,180,0.75)";
  ctx.lineWidth = 2.2;
  ctx.shadowColor = "rgba(233,196,106,0.9)";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  ctx.stroke();
  ctx.shadowBlur = 0;
  points.forEach(([x, y]) => sparkle(ctx, x, y, 11));
  // Son étoile, au sommet de la couronne.
  const [topX, topY] = points[5];
  glow(ctx, topX, topY, 120, "rgba(255,214,150,ALPHA)", 0.45);
  sparkle(ctx, topX, topY, 34);

  // Les mots.
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(233,196,106,0.95)";
  ctx.font = `500 30px ${display}`;
  ctx.letterSpacing = "12px";
  ctx.fillText("L’ÉTOILE", WIDTH / 2 + 6, 760);
  ctx.letterSpacing = "0px";

  const gold = ctx.createLinearGradient(0, 790, 0, 960);
  gold.addColorStop(0, "#fff6dc");
  gold.addColorStop(0.45, "#e9c46a");
  gold.addColorStop(1, "#b8862f");
  ctx.fillStyle = gold;
  ctx.shadowColor = "rgba(233,196,106,0.55)";
  ctx.shadowBlur = 30;
  ctx.font = `190px ${script}`;
  ctx.fillText(reine.prenom, WIDTH / 2, 930);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "rgba(251,241,220,0.92)";
  ctx.font = `500 34px ${display}`;
  ctx.letterSpacing = "10px";
  ctx.fillText(reine.suiteDuNom.toUpperCase(), WIDTH / 2 + 5, 1010);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = "rgba(251,241,220,0.85)";
  ctx.font = `italic 500 40px ${serif}`;
  ctx.fillText(`Allumée le ${todayLabel()}`, WIDTH / 2, 1090);
  ctx.fillText(reine.final.apresLeNom, WIDTH / 2, 1145);

  if (reine.signature) {
    ctx.fillStyle = "#ffb8cc";
    ctx.font = `76px ${script}`;
    ctx.fillText(`— ${reine.signature}`, WIDTH / 2, 1250);
  }

  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
}

/** Partage l'image (téléphone) ou la télécharge (ordinateur). */
export async function keepStar(): Promise<"shared" | "downloaded" | "failed"> {
  const blob = await drawKeepsake();
  if (!blob) return "failed";
  const file = new File([blob], `etoile-${reine.prenom.toLowerCase()}.jpg`, { type: "image/jpeg" });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: `L’étoile ${reine.prenom}` });
      return "shared";
    }
  } catch (error) {
    if ((error as DOMException)?.name === "AbortError") return "shared";
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}
