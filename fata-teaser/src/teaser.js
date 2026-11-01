/* Fata School — teaser « Quelque chose se prépare » (15 s, 1080 × 1920).
 *
 * Moteur entièrement déterministe : render(t) dessine l'image exacte de
 * l'instant t (en secondes). render.js appelle render(i / fps) image par
 * image et envoie le résultat à ffmpeg. Ouvrir teaser.html?play dans un
 * navigateur lance un aperçu en temps réel (sans son).
 */
"use strict";

const W = 1080, H = 1920, CX = W / 2, CY = H / 2;
const COL = { Y: "#FFC400", G: "#1E8E3E", K: "#111111", W: "#FFFFFF" };
const RGB = { Y: [255, 196, 0], G: [30, 142, 62], K: [17, 17, 17], W: [255, 255, 255] };
const rgba = (k, a) => `rgba(${RGB[k][0]},${RGB[k][1]},${RGB[k][2]},${a})`;

const cv = document.getElementById("c");
const ctx = cv.getContext("2d");
const buf = document.createElement("canvas"); // tampon pour les glitchs
buf.width = W; buf.height = H;
const bctx = buf.getContext("2d");
const logoCv = document.createElement("canvas"); // logo + reflet
const lctx = logoCv.getContext("2d");

/* ------------------------------------------------------------------ outils */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  outExpo: x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  inExpo: x => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
  inOutExpo: x => x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2,
  outCubic: x => 1 - Math.pow(1 - x, 3),
  inCubic: x => x * x * x,
  inOutCubic: x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outQuint: x => 1 - Math.pow(1 - x, 5),
  inOutSine: x => -(Math.cos(Math.PI * x) - 1) / 2,
  outBack: x => { const c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// bruit lisse 1D (somme de sinus) pour les tremblements de caméra
const wob = (x, s = 0) => Math.sin(x * 1.31 + s) * 0.5 + Math.sin(x * 2.17 + s * 1.7) * 0.3 + Math.sin(x * 3.73 + s * 2.3) * 0.2;
// enveloppe d'impact : montée quasi immédiate, chute exponentielle
const hitEnv = (d, k = 8) => (d < 0 ? 0 : Math.exp(-d * k) * (1 - Math.exp(-d * 80)));

let TL = null; // chronologie partagée avec la bande-son (timeline.json)
const LOGO = { parts: null, img: {} };

/* ------------------------------------------------------------------ texte */
function font(size, fam = "Anton") { ctx.font = `${size}px "${fam}"`; }
function capH(size, fam = "Anton") { font(size, fam); return ctx.measureText("H").actualBoundingBoxAscent; }
function fit(str, maxW, maxSize, fam = "Anton", spacing = 0) {
  font(100, fam);
  const w = ctx.measureText(str).width + spacing * 100 * ([...str].length - 1);
  return Math.min(maxSize, (100 * maxW) / w);
}
/* Position de chaque lettre (crénage conservé via les préfixes). */
function layout(str, size, fam = "Anton", spacing = 0) {
  font(size, fam);
  const chars = [...str];
  const xs = chars.map((_, i) => ctx.measureText(chars.slice(0, i).join("")).width + i * spacing * size);
  const ws = chars.map(c => ctx.measureText(c).width);
  const total = ctx.measureText(str).width + spacing * size * (chars.length - 1);
  return { chars, xs, ws, total };
}
/* Dessine une ligne centrée en (cx, cy = milieu des capitales), lettre à lettre.
 * fx(i, n) -> { a, dx, dy, s, blur, color, rot } */
function drawLine(str, cx, cy, size, fx, fam = "Anton", spacing = 0) {
  const L = layout(str, size, fam, spacing);
  const ch = capH(size, fam);
  const x0 = cx - L.total / 2, base = cy + ch / 2;
  font(size, fam);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  L.chars.forEach((c, i) => {
    const f = fx(i, L.chars.length, c);
    if (!f || f.a <= 0.003) return;
    ctx.save();
    ctx.globalAlpha *= clamp(f.a);
    const lx = x0 + L.xs[i] + L.ws[i] / 2, ly = base - ch / 2;
    ctx.translate(lx + (f.dx || 0), ly + (f.dy || 0));
    if (f.rot) ctx.rotate(f.rot);
    if (f.s !== undefined) ctx.scale(f.s, f.s);
    if (f.blur > 0.3) ctx.filter = `blur(${f.blur.toFixed(1)}px)`;
    ctx.fillStyle = f.color;
    ctx.fillText(c, -L.ws[i] / 2, ch / 2);
    ctx.restore();
  });
  return { L, ch, x0, base };
}

/* ------------------------------------------------------------------ caméra */
function camera(zoom, rot, ox, oy, fn, px = CX, py = CY) {
  ctx.save();
  ctx.translate(px + ox, py + oy);
  ctx.rotate(rot);
  ctx.scale(zoom, zoom);
  ctx.translate(-px, -py);
  fn();
  ctx.restore();
}
function shake(t, times, amp, k = 9) {
  let x = 0, y = 0;
  for (const ti of times) {
    const e = hitEnv(t - ti, k) * amp;
    if (e <= 0.01) continue;
    x += e * wob(t * 55, ti * 10);
    y += e * wob(t * 61, ti * 10 + 4);
  }
  return [x, y];
}

/* ------------------------------------------------------------------ ambiance */
const grain = [];
function makeGrain() {
  for (let k = 0; k < 6; k++) {
    const g = document.createElement("canvas");
    g.width = g.height = 256;
    const gx = g.getContext("2d");
    const im = gx.createImageData(256, 256);
    const r = rng(1000 + k);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = (r() * 255) | 0;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
      im.data[i + 3] = 255;
    }
    gx.putImageData(im, 0, 0);
    grain.push(g);
  }
}
function drawGrain(t, alpha) {
  const f = Math.floor(t * 30);
  const g = grain[f % grain.length];
  const r = rng(f * 13 + 7);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = "overlay";
  const ox = -Math.floor(r() * 256), oy = -Math.floor(r() * 256);
  for (let y = oy; y < H; y += 256) for (let x = ox; x < W; x += 256) ctx.drawImage(g, x, y);
  ctx.restore();
}
function vignette(strength, color = "0,0,0") {
  const g = ctx.createRadialGradient(CX, CY, H * 0.22, CX, CY, H * 0.62);
  g.addColorStop(0, `rgba(${color},0)`);
  g.addColorStop(1, `rgba(${color},${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}
function glow(x, y, r, k, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(k, a));
  g.addColorStop(0.35, rgba(k, a * 0.35));
  g.addColorStop(1, rgba(k, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
/* Reflet anamorphique : longue traînée horizontale de lumière. */
function flare(x, y, len, k, a, thick = 3) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const [h, aa] of [[thick, a], [thick * 6, a * 0.25], [thick * 20, a * 0.08]]) {
    const g = ctx.createLinearGradient(x - len, 0, x + len, 0);
    g.addColorStop(0, rgba(k, 0));
    g.addColorStop(0.5, rgba(k, aa));
    g.addColorStop(1, rgba(k, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - len, y - h / 2, len * 2, h);
  }
  ctx.restore();
}
/* Glitch : décale des bandes horizontales de l'image et sépare jaune / vert. */
function glitch(t, intensity, seed = 0) {
  if (intensity <= 0.02) return;
  const r = rng(Math.floor(t * 30) * 31 + seed);
  bctx.clearRect(0, 0, W, H);
  bctx.drawImage(cv, 0, 0);
  const n = 3 + Math.floor(intensity * 9);
  for (let i = 0; i < n; i++) {
    const y = r() * H, h = 8 + r() * 120 * intensity;
    const dx = (r() - 0.5) * 160 * intensity;
    ctx.drawImage(buf, 0, y, W, h, dx, y, W, h);
    if (r() < 0.5) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.35 * intensity;
      ctx.fillStyle = r() < 0.5 ? COL.Y : COL.G;
      ctx.fillRect(0, y, W, Math.min(h, 6 + r() * 10));
      ctx.restore();
    }
  }
}

/* ------------------------------------------------------------------ formes */
function shapePath(type, s) {
  ctx.beginPath();
  switch (type) {
    case "tri":
      for (let k = 0; k < 3; k++) {
        const a = -Math.PI / 2 + (k * 2 * Math.PI) / 3;
        k ? ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s) : ctx.moveTo(Math.cos(a) * s, Math.sin(a) * s);
      }
      ctx.closePath();
      break;
    case "sq": ctx.rect(-s * 0.75, -s * 0.75, s * 1.5, s * 1.5); break;
    case "circ": ctx.arc(0, 0, s, 0, Math.PI * 2); break;
    case "bar": ctx.rect(-s * 1.8, -s * 0.2, s * 3.6, s * 0.4); break;
    case "plus":
      ctx.rect(-s, -s * 0.22, s * 2, s * 0.44);
      ctx.rect(-s * 0.22, -s, s * 0.44, s * 2);
      break;
  }
}
function drawShape(type, s, k, filled, lw) {
  shapePath(type, s);
  if (filled && type !== "ring") { ctx.fillStyle = COL[k]; ctx.fill(type === "plus" ? "nonzero" : "nonzero"); }
  else {
    if (type === "ring") { ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.setLineDash([s * 0.25, s * 0.18]); }
    ctx.strokeStyle = COL[k];
    ctx.lineWidth = lw;
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/* Formes 3D qui foncent vers la caméra (scène 2). */
const FLY = [];
function makeFly() {
  const r = rng(42);
  const types = ["tri", "sq", "circ", "bar", "plus", "ring", "tri", "circ"];
  const ks = ["Y", "G", "W", "Y", "G"];
  for (let i = 0; i < 26; i++) {
    let x = (r() - 0.5) * 2200, y = (r() - 0.5) * 3600;
    if (Math.abs(x) < 380 && Math.abs(y) < 300) x += Math.sign(x || 1) * 500; // garde le centre lisible
    FLY.push({
      x, y, z0: 600 + r() * 3200, v: 900 + r() * 1300,
      type: types[i % types.length], k: ks[i % ks.length], filled: r() < 0.45,
      size: 70 + r() * 110, rot0: r() * 6.28, vr: (r() - 0.5) * 3,
    });
  }
}
function drawFly(u, alphaMul) {
  const F = 700;
  for (const f of FLY) {
    let z = f.z0 - f.v * u;
    z = ((z % 3800) + 3800) % 3800 + 60;
    const s = F / z;
    const a = clamp((3800 - z) / 1600) * clamp((z - 60) / 260) * alphaMul;
    if (a <= 0.01) continue;
    ctx.save();
    ctx.globalAlpha = a * (f.filled ? 0.85 : 1);
    ctx.translate(CX + f.x * s, CY + f.y * s);
    ctx.rotate(f.rot0 + f.vr * u);
    drawShape(f.type, f.size * s, f.k, f.filled, Math.max(2, 7 * s));
    ctx.restore();
  }
}

/* ------------------------------------------------------------------ poussières */
const DUST = [];
function makeDust() {
  const r = rng(7);
  for (let i = 0; i < 90; i++) DUST.push({ x: r() * W, y: r() * H, z: 0.3 + r() * 1.4, v: 8 + r() * 30, ph: r() * 6.28, k: r() < 0.2 ? "Y" : "W" });
}
function drawDust(t, a) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const d of DUST) {
    const y = ((d.y - d.v * d.z * t) % H + H) % H;
    const x = d.x + Math.sin(t * 0.6 + d.ph) * 14 * d.z;
    const tw = 0.5 + 0.5 * Math.sin(t * 2.4 + d.ph * 3);
    ctx.globalAlpha = a * (0.15 + 0.4 * tw) * clamp(d.z / 1.2);
    ctx.fillStyle = COL[d.k];
    ctx.beginPath();
    ctx.arc(x, y, 1.2 * d.z + 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* ======================================================= SCÈNE 1 — MYSTÈRE */
function heartPulse(t) {
  let p = 0;
  for (const b of TL.heart) p += hitEnv(t - b, 7) + 0.45 * hitEnv(t - b - 0.19, 9);
  return p;
}
function scene1(t) {
  ctx.fillStyle = COL.K;
  ctx.fillRect(0, 0, W, H);

  const dive = E.inExpo(prog(t, 2.55, 3.0));
  const zoom = 1 + 0.07 * E.inOutSine(prog(t, 0, 2.55)) + 1.4 * dive;
  const [sx, sy] = shake(t, TL.heart, 3, 7);
  // le point monte pour laisser la place au texte
  const dotY = CY - 360 * E.inOutCubic(prog(t, TL.textIn - 0.15, TL.textIn + 0.55));
  const pulse = heartPulse(t);

  camera(zoom, 0, sx, sy, () => {
    drawDust(t, clamp(t / 1.2) * (1 - dive));

    // halo et ondes du point
    const appear = E.outBack(prog(t, TL.heart[0] - 0.05, TL.heart[0] + 0.3));
    const inhale = 1 - E.inCubic(prog(t, 2.82, 2.97));
    const r = 15 * appear * inhale * (1 + 0.55 * pulse);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    glow(CX, dotY, 260 + 140 * pulse, "Y", (0.16 + 0.22 * pulse) * appear * inhale);
    ctx.restore();
    for (const b of TL.heart) {
      const d = t - b;
      if (d < 0 || d > 2.2) continue;
      ctx.save();
      ctx.strokeStyle = rgba("Y", 0.55 * Math.exp(-d * 1.7) * inhale);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(CX, dotY, 22 + E.outCubic(clamp(d / 2.2)) * 520, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    flare(CX, dotY, 520 + 160 * pulse, "Y", (0.22 + 0.35 * pulse) * appear * inhale, 2.5);
    if (r > 0.2) {
      ctx.save();
      ctx.shadowColor = COL.Y;
      ctx.shadowBlur = 40;
      ctx.fillStyle = COL.Y;
      ctx.beginPath();
      ctx.arc(CX, dotY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // « ET SI QUELQUE CHOSE SE PRÉPARAIT ? »
    const lines = [
      { s: "ET SI", size: 92, y: CY - 70, t0: TL.textIn, sp: 0.14, k: "Y" },
      { s: "QUELQUE CHOSE", size: fit("QUELQUE CHOSE", 900, 170), y: CY + 100, t0: TL.textIn + 0.28, sp: 0 },
      { s: "SE PRÉPARAIT ?", size: fit("SE PRÉPARAIT ?", 900, 170), y: CY + 300, t0: TL.textIn + 0.78, sp: 0 },
    ];
    const out = prog(t, 2.6, 2.95);
    for (const L of lines) {
      drawLine(L.s, CX, L.y, L.size, (i, n, c) => {
        const ti = L.t0 + i * 0.045;
        const p = prog(t, ti, ti + 0.42);
        if (p <= 0) return null;
        const e = E.outExpo(p);
        const flick = p < 0.35 && Math.floor(t * 30 + i) % 2 === 0;
        const yellowChar = c === "?" || L.k === "Y";
        return {
          a: e * (1 - out),
          dy: (1 - e) * 46 - out * (L.y - CY) * 0.5,
          blur: (1 - e) * 14 + out * 10,
          s: 1 + (1 - e) * 0.18,
          color: flick ? COL.Y : yellowChar ? COL.Y : COL.W,
        };
      }, "Anton", L.sp);
    }
  });

  // petit glitch de tension
  glitch(t, hitEnv(t - 2.2, 14) * 0.9 + hitEnv(t - 2.86, 10) * 1.2, 3);
  // noir total juste avant l'impact
  if (t > 2.93) { ctx.fillStyle = "#000"; ctx.globalAlpha = E.outCubic(prog(t, 2.93, 2.99)); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}

/* ===================================================== SCÈNE 2 — DESTINATAIRES */
function outlineRows(word, t, alpha, k) {
  const size = 250;
  ctx.save();
  ctx.translate(CX, CY);
  ctx.rotate(-0.14);
  font(size);
  ctx.textBaseline = "middle";
  ctx.lineWidth = 2;
  ctx.strokeStyle = rgba(k, alpha);
  const L = ctx.measureText(word + "  ").width;
  for (let row = -5; row <= 5; row++) {
    const dir = row % 2 ? 1 : -1;
    const off = ((t * 160 * dir) % L + L) % L;
    for (let x = -1800 - off; x < 1800; x += L) ctx.strokeText(word, x, row * 280);
  }
  ctx.restore();
}
function sliceWord(word, cx, cy, size, color, dotColor, u, alpha) {
  // le mot entre en 6 bandes horizontales venant de côtés alternés
  const L = layout(word, size), ch = capH(size);
  const strips = 6, top = cy - ch / 2 - 30, hh = (ch + 60) / strips;
  const x0 = cx - L.total / 2;
  font(size);
  ctx.textBaseline = "alphabetic";
  for (let k = 0; k < strips; k++) {
    const p = E.outExpo(prog(u, k * 0.025, 0.42 + k * 0.025));
    const dx = (k % 2 ? 1 : -1) * (1 - p) * 1300;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.rect(0, top + k * hh - 0.5, W, hh + 1);
    ctx.clip();
    ctx.translate(dx, 0);
    const main = word.slice(0, -1);
    ctx.fillStyle = color;
    ctx.fillText(main, x0, cy + ch / 2);
    ctx.fillStyle = dotColor;
    ctx.fillText(".", x0 + ctx.measureText(main).width, cy + ch / 2);
    ctx.restore();
  }
}
function slamWord(word, cx, cy, size, color, dotColor, u, alpha) {
  const p = prog(u, 0, 0.24);
  const sc = 1 + 1.5 * (1 - E.outQuint(p));
  const L = layout(word, size), ch = capH(size);
  const main = word.slice(0, -1);
  const draw = (s, a, dx, col, dcol) => {
    ctx.save();
    ctx.globalAlpha = a * alpha;
    ctx.translate(cx + dx, cy);
    ctx.scale(s, s);
    font(size);
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = col;
    ctx.fillText(main, -L.total / 2, ch / 2);
    ctx.fillStyle = dcol;
    ctx.fillText(".", -L.total / 2 + ctx.measureText(main).width, ch / 2);
    ctx.restore();
  };
  // traînées de mouvement
  for (let k = 3; k >= 1; k--) {
    const pk = prog(u - k * 0.03, 0, 0.24);
    if (pk < 1) draw(1 + 1.5 * (1 - E.outQuint(pk)), 0.14 * clamp(p * 4), 0, color, dotColor);
  }
  // séparation jaune / vert à l'impact
  const split = hitEnv(u - 0.2, 7) * 26;
  if (split > 0.5) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    draw(sc, 0.55, -split, COL.G, COL.G);
    draw(sc, 0.55, split, COL.W, COL.W);
    ctx.restore();
  }
  draw(sc, clamp(p * 5), 0, color, dotColor);
}
function sweepBar(u, d, angle, k, thick, len, alpha = 1) {
  const p = E.inOutCubic(prog(u, 0, d));
  if (p <= 0 || p >= 1) return;
  ctx.save();
  ctx.translate(CX, CY);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = COL[k];
  const x = lerp(-1900, 1900, p);
  ctx.fillRect(x - len / 2, -thick / 2, len, thick);
  ctx.restore();
}
function shockRing(u, k, maxR, lw, dur = 0.7) {
  const p = prog(u, 0, dur);
  if (p <= 0 || p >= 1) return;
  ctx.save();
  ctx.strokeStyle = COL[k];
  ctx.globalAlpha = 1 - p;
  ctx.lineWidth = lw * (1 - p) + 1;
  ctx.beginPath();
  ctx.arc(CX, CY, E.outExpo(p) * maxR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
function word1Layer(t) {
  const u = t - TL.hit1;
  ctx.fillStyle = COL.K;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(CX, CY, 900, "Y", 0.10 + 0.25 * hitEnv(u, 4));
  ctx.restore();
  outlineRows("COLLÉGIENS", t, 0.10 * E.outCubic(prog(u, 0.1, 0.6)), "Y");
  drawFly(u + 0.6, clamp(u * 3));
  sweepBar(u, 0.42, -0.42, "Y", 170, 2600);
  sweepBar(u - 0.06, 0.42, -0.42, "G", 26, 2600);
  sweepBar(u - 0.12, 0.42, -0.42, "W", 6, 2600, 0.8);
  shockRing(u, "W", 1200, 34);
  const size = fit("COLLÉGIENS.", 960, 250);
  const breathe = 1 + 0.035 * E.inOutSine(prog(u, 0.4, 1.4));
  camera(breathe, 0, 0, 0, () => sliceWord("COLLÉGIENS.", CX, CY, size, COL.W, COL.Y, u, 1));
  // petite pulsation (tic) : liseré vert sous le mot
  const lp = E.outExpo(prog(t, TL.tick, TL.tick + 0.4));
  ctx.fillStyle = COL.G;
  const bw = 520 * lp;
  ctx.fillRect(CX - bw / 2, CY + capH(size) / 2 + 46, bw, 12);
  ctx.fillStyle = COL.Y;
  ctx.fillRect(CX - bw / 2 - 26, CY + capH(size) / 2 + 46, lp > 0 ? 14 : 0, 12);
}
function word2Layer(t) {
  const u = t - TL.hit2;
  ctx.fillStyle = COL.K;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(CX, CY, 950, "G", 0.18 + 0.35 * hitEnv(u, 4));
  ctx.restore();
  outlineRows("LYCÉENS", t, 0.11 * E.outCubic(prog(u, 0.05, 0.5)), "G");
  drawFly(u + 2.1, 1);
  // éclats en diagonale à l'impact
  for (let k = 0; k < 5; k++) sweepBar(u - k * 0.035, 0.38, 0.52, k % 2 ? "W" : "Y", k === 0 ? 120 : 10, 2600, k === 0 ? 1 : 0.8);
  shockRing(u, "Y", 1300, 40, 0.8);
  shockRing(u - 0.08, "G", 1100, 20, 0.8);
  const size = fit("LYCÉENS.", 940, 330);
  const breathe = 1 + 0.03 * E.inOutSine(prog(u, 0.3, 1.0));
  camera(breathe, 0, 0, 0, () => slamWord("LYCÉENS.", CX, CY, size, COL.Y, COL.G, u, 1));
  // deuxième frappe : contour blanc qui jaillit du mot
  const u3 = t - TL.hit3;
  if (u3 > 0 && u3 < 0.6) {
    const p = E.outExpo(prog(u3, 0, 0.6));
    ctx.save();
    ctx.translate(CX, CY);
    ctx.scale(1 + p * 0.5, 1 + p * 0.5);
    font(size);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.lineWidth = 3;
    ctx.strokeStyle = rgba("W", 1 - p);
    ctx.strokeText("LYCÉENS.", 0, capH(size) / 2);
    ctx.restore();
  }
}
function scene2(t) {
  const [sx, sy] = shake(t, [TL.hit1, TL.hit2, TL.hit3], 26, 9);
  const suck = E.inExpo(prog(t, TL.suck, TL.tunnel));
  const zoom = 1 - 0.97 * suck;
  const rot = -0.9 * suck;

  camera(zoom, rot, sx, sy, () => {
    // volet vert diagonal entre les deux mots
    const wp = E.inOutCubic(prog(t, TL.wipe, TL.hit2 + 0.12));
    if (t < TL.wipe) word1Layer(t);
    else if (wp >= 1) word2Layer(t);
    else {
      const ang = -0.35;
      const band = 1500;
      const lead = lerp(1900, -1900 - band, wp); // position du bord avant (repère tourné)
      const clipBelow = (fn, y0) => {
        ctx.save();
        ctx.translate(CX, CY); ctx.rotate(ang);
        ctx.beginPath(); ctx.rect(-2400, y0, 4800, 4800); ctx.clip();
        ctx.rotate(-ang); ctx.translate(-CX, -CY);
        fn(); ctx.restore();
      };
      word1Layer(t);
      clipBelow(() => word2Layer(t), lead + band);
      ctx.save();
      ctx.translate(CX, CY); ctx.rotate(ang);
      ctx.fillStyle = COL.G;
      ctx.fillRect(-2400, lead, 4800, band);
      ctx.fillStyle = COL.Y;
      ctx.fillRect(-2400, lead - 18, 4800, 18);
      ctx.fillStyle = COL.W;
      ctx.fillRect(-2400, lead + band, 4800, 6);
      ctx.restore();
    }
  });
  if (suck > 0) { // tout est aspiré vers le centre
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    glow(CX, CY, 500, "Y", 0.6 * suck);
    ctx.restore();
  }
  // flashs d'impact
  const fl = 0.55 * hitEnv(t - TL.hit1, 10) + 0.4 * hitEnv(t - TL.hit2, 11) + 0.18 * hitEnv(t - TL.hit3, 12);
  if (fl > 0.01) { ctx.fillStyle = rgba("W", fl); ctx.fillRect(0, 0, W, H); }
  glitch(t, hitEnv(t - TL.hit1, 9) * 0.8 + hitEnv(t - 4.05, 16) + hitEnv(t - TL.hit2, 8) * 1.1 + suck * 0.6, 5);
  vignette(0.6);
}

/* ===================================================== SCÈNE 3 — MONTÉE */
const STREAKS = [], SHARDS = [];
function makeTunnel() {
  const r = rng(99);
  for (let i = 0; i < 260; i++) STREAKS.push({ a: r() * 6.283, rad: 120 + r() * 900, z0: r() * 4000, k: r() < 0.12 ? "Y" : r() < 0.2 ? "G" : "W", w: 1 + r() * 2.5 });
  for (let i = 0; i < 40 * 14; i++) SHARDS.push({ a: r() * 6.283, v: 700 + r() * 1700, s: 10 + r() * 30, rot: r() * 6, vr: (r() - 0.5) * 14, k: r() < 0.5 ? "Y" : r() < 0.75 ? "G" : "W" });
}
const tunnelDist = u => 700 * u + 520 * u * u;
function scene3(t) {
  const u = t - TL.tunnel;
  const dist = tunnelDist(u);
  const speed = 700 + 1040 * u;
  const rise = prog(t, TL.tunnel, TL.stop);
  ctx.fillStyle = COL.K;
  ctx.fillRect(0, 0, W, H);

  const beats = TL.build;
  let bp = 0, lastBeat = 0, bi = -1;
  beats.forEach((b, i) => { if (t >= b) { lastBeat = b; bi = i; } });
  bp = hitEnv(t - lastBeat, 9);
  const vx = CX + 70 * Math.sin(u * 1.4), vy = CY + 90 * Math.sin(u * 1.05 + 1);
  const roll = 0.18 * u + 0.06 * u * u;
  const pump = 1 + 0.035 * bp + 0.12 * E.inCubic(rise);
  const [sx, sy] = shake(t, beats, 10 + 18 * rise, 10);
  const F = 640;

  // explosion d'ouverture : ce qui était aspiré ressort
  const burst = 1 - E.outCubic(prog(u, 0, 0.5));

  camera(pump, roll, sx, sy, () => {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    glow(vx, vy, 700, bi % 2 ? "G" : "Y", 0.22 + 0.25 * bp + 0.5 * burst);
    ctx.restore();

    // anneaux du tunnel
    const SP = 420, N = 11, ZMAX = SP * N;
    for (let i = 0; i < N; i++) {
      const abs = Math.floor((dist - i * SP) / ZMAX); // identité stable de l'anneau
      let z = ((i * SP - dist) % ZMAX + ZMAX) % ZMAX + 40;
      const s = F / z;
      const R = 560 * s;
      if (R > 2600) continue;
      const id = i + abs * N;
      const k = ["Y", "G", "W", "Y", "G"][((id % 5) + 5) % 5];
      const a = clamp((ZMAX - z) / 1800) * clamp(u * 2.5);
      ctx.save();
      ctx.translate(vx, vy);
      ctx.rotate(id * 0.7 + u * (id % 2 ? 1.2 : -1.2));
      ctx.strokeStyle = rgba(k, a * (0.65 + 0.35 * bp));
      ctx.lineWidth = Math.min(46, 5 * s);
      if (id % 3 === 0) ctx.setLineDash([R * 0.5, R * 0.35]);
      else if (id % 3 === 1) ctx.setLineDash([R * 1.6, R * 0.25]);
      ctx.beginPath();
      if (id % 4 === 3) { // anneau carré : la géométrie se mélange
        ctx.rect(-R, -R, 2 * R, 2 * R);
      } else ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // traînées d'étoiles : vitesse lumière
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (const p of STREAKS) {
      let z = ((p.z0 - dist * 1.3) % 4000 + 4000) % 4000 + 30;
      const len = Math.min(z - 20, speed * 0.09 + 40);
      const s1 = F / z, s2 = F / (z + len);
      const c = Math.cos(p.a), sn = Math.sin(p.a);
      const a = clamp((4000 - z) / 1500) * clamp(u * 3);
      ctx.strokeStyle = rgba(p.k, 0.75 * a);
      ctx.lineWidth = p.w * Math.min(4, s1);
      ctx.beginPath();
      ctx.moveTo(vx + c * p.rad * s2, vy + sn * p.rad * s2);
      ctx.lineTo(vx + c * p.rad * s1, vy + sn * p.rad * s1);
      ctx.stroke();
    }
    ctx.restore();

    // éclats jaunes et verts projetés sur les temps forts
    beats.forEach((b, bIdx) => {
      const d = t - b;
      if (d < 0 || d > 1.1) return;
      const n = bIdx < 8 ? 18 : 9;
      for (let j = 0; j < n; j++) {
        const sh = SHARDS[(bIdx * 40 + j) % SHARDS.length];
        const dd = sh.v * (1 - Math.exp(-d * 3)) / 3 + d * 300;
        ctx.save();
        ctx.globalAlpha = clamp(1 - d / 1.1);
        ctx.translate(vx + Math.cos(sh.a) * dd, vy + Math.sin(sh.a) * dd);
        ctx.rotate(sh.rot + sh.vr * d);
        drawShape("tri", sh.s * (1 + d * 1.5), sh.k, true, 2);
        ctx.restore();
      }
    });

    // cercles concentriques qui envahissent l'écran à l'approche du sommet
    for (let k = 0; k < 6; k++) {
      const ph = (u * (0.8 + rise * 2.2) + k / 6) % 1;
      ctx.strokeStyle = rgba(k % 2 ? "G" : "Y", (1 - ph) * 0.5 * rise);
      ctx.lineWidth = 2 + 10 * ph;
      ctx.beginPath();
      ctx.arc(vx, vy, ph * 1300, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  // « ÊTES-VOUS » / « PRÊTS ? » — en espace écran, au-dessus du tunnel
  const [tx, ty] = shake(t, beats, 6 + 10 * rise, 12);
  const showText = t >= TL.q1;
  if (showText) {
    // assombrit le centre pour la lisibilité
    const g = ctx.createRadialGradient(CX, CY, 50, CX, CY, 900);
    g.addColorStop(0, "rgba(17,17,17,0.82)");
    g.addColorStop(1, "rgba(17,17,17,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const s1 = fit("ÊTES-VOUS", 900, 230);
    const p1 = prog(t, TL.q1, TL.q1 + 0.34);
    const e1 = E.outExpo(p1);
    ctx.save();
    ctx.translate(CX + tx, CY - 175 + ty);
    const sc1 = lerp(0.25, 1, e1) * (1 + 0.025 * bp);
    ctx.scale(sc1, sc1);
    ctx.globalAlpha = clamp(p1 * 3);
    if (p1 < 1) ctx.filter = `blur(${((1 - e1) * 18).toFixed(1)}px)`;
    font(s1);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 40;
    ctx.fillStyle = COL.W;
    ctx.fillText("ÊTES-VOUS", 0, capH(s1) / 2);
    ctx.restore();

    if (t >= TL.q2) {
      const s2 = fit("PRÊTS ?", 900, 360);
      const p2 = prog(t, TL.q2, TL.q2 + 0.2);
      const sc2 = (1 + 1.6 * (1 - E.outQuint(p2))) * (1 + 0.04 * bp);
      const y2 = CY + 150 + capH(s2) * 0.25;
      const split = hitEnv(t - TL.q2 - 0.18, 6) * 30 + rise * rise * 14 * bp;
      const drawP = (dx, col, qcol, a, comp) => {
        ctx.save();
        if (comp) ctx.globalCompositeOperation = comp;
        ctx.translate(CX + tx + dx, y2 + ty);
        ctx.scale(sc2, sc2);
        ctx.globalAlpha = a;
        font(s2);
        ctx.textBaseline = "alphabetic";
        const wMain = ctx.measureText("PRÊTS ").width, wAll = ctx.measureText("PRÊTS ?").width;
        ctx.fillStyle = col;
        ctx.fillText("PRÊTS ", -wAll / 2, capH(s2) / 2);
        ctx.fillStyle = qcol;
        ctx.fillText("?", -wAll / 2 + wMain, capH(s2) / 2);
        ctx.restore();
      };
      if (split > 0.5) { drawP(-split, COL.G, COL.G, 0.7, "lighter"); drawP(split, COL.W, COL.W, 0.45, "lighter"); }
      drawP(0, COL.Y, COL.W, clamp(p2 * 5), null);
    }
  }

  // flashs : forts au début, discrets quand le rythme s'emballe (confort visuel)
  let fl = 0;
  beats.forEach((b, i) => { fl += (i < 4 ? 0.28 : i < 8 ? 0.16 : 0.07) * hitEnv(t - b, 14); });
  fl += 0.6 * hitEnv(t - TL.q2, 10) + 0.85 * burst * burst;
  if (fl > 0.01) {
    ctx.fillStyle = rgba(burst > 0.3 ? "Y" : "W", Math.min(0.9, fl));
    ctx.fillRect(0, 0, W, H);
  }
  glitch(t, Math.pow(rise, 3) * 0.9 * (0.5 + bp) + hitEnv(t - TL.q2, 8) * 0.7, 9);
  vignette(0.7);
}

/* ===================================================== SCÈNE 4 — SIGNATURE */
const CONFETTI = [];
function makeConfetti() {
  const r = rng(2026);
  for (let i = 0; i < 150; i++) {
    const a = r() * 6.283, v = 500 + r() * 1900;
    CONFETTI.push({ vx: Math.cos(a) * v, vy: Math.sin(a) * v * 1.2, k: ["Y", "Y", "G", "K", "Y", "G"][i % 6], s: 5 + r() * 13, type: r() < 0.5 ? "sq" : r() < 0.6 ? "circ" : "tri", rot: r() * 6, vr: (r() - 0.5) * 8, fall: 40 + r() * 90, ph: r() * 6 });
  }
}
const LOGO_W = 820, LOGO_Y = 790;
function drawLogo(u, t) {
  const P = LOGO.parts;
  const sc = LOGO_W / P.W;
  const sting = t - TL.sting;
  const squeeze = sting > 0 ? Math.sin(clamp(sting / 0.5) * Math.PI) * 26 * (1 - clamp(sting / 0.5)) * 1.6 : 0;
  lctx.setTransform(1, 0, 0, 1, 0, 0);
  lctx.clearRect(0, 0, logoCv.width, logoCv.height);
  lctx.setTransform(sc, 0, 0, sc, 0, 0);
  const put = (name, dx, dy, s, rot, a) => {
    const p = P[name], img = LOGO.img[name];
    if (a <= 0) return;
    lctx.save();
    lctx.globalAlpha = clamp(a);
    lctx.translate(p.x + p.w / 2 + dx, p.y + p.h + dy);
    lctx.rotate(rot);
    lctx.scale(s, s);
    lctx.drawImage(img, -p.w / 2, -p.h);
    lctx.restore();
  };
  // accolades : arrivent des bords, puis « respirent » à la fin
  const bp = E.outExpo(prog(u, 0.02, 0.62));
  const off = (1 - bp) * 2600;
  put("brace-left", -off + squeeze / sc, 0, 1, -(1 - bp) * 0.9, 1);
  put("brace-right", off - squeeze / sc, 0, 1, (1 - bp) * 0.9, 1);
  ["f", "a1", "t", "a2"].forEach((n, i) => {
    const p = prog(u, 0.14 + i * 0.065, 0.62 + i * 0.065);
    const e = E.outBack(p);
    put(n, 0, (1 - E.outExpo(p)) * 240, Math.max(0, e), 0, clamp(p * 4));
  });
  // reflet lumineux qui balaye le logo
  for (const [t0, dur] of [[0.75, 0.7], [TL.sting - TL.reveal + 0.05, 0.6]]) {
    const sp = prog(u, t0, t0 + dur);
    if (sp <= 0 || sp >= 1) continue;
    lctx.save();
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    lctx.globalCompositeOperation = "source-atop";
    const x = lerp(-300, logoCv.width + 300, E.inOutCubic(sp));
    const g = lctx.createLinearGradient(x - 160, 0, x + 160, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    lctx.fillStyle = g;
    lctx.transform(1, 0, -0.35, 1, 0, 0);
    lctx.fillRect(-600, 0, logoCv.width + 1200, logoCv.height);
    lctx.restore();
  }
  const float = Math.sin(t * 1.7) * 4 * clamp(u - 1);
  ctx.drawImage(logoCv, CX - (P.W * sc) / 2, LOGO_Y - (P.H * sc) / 2 + float);
}
function dotsLoader(x, y, t, a) {
  for (let k = 0; k < 3; k++) {
    const ph = (t * 2.2 - k * 0.22) % 1;
    const s = 0.6 + 0.4 * Math.max(0, Math.sin(ph * Math.PI));
    ctx.globalAlpha = a * (0.45 + 0.55 * s);
    ctx.fillStyle = COL.G;
    const r = 13 * s;
    ctx.fillRect(x + k * 38 - r, y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;
}
function scene4(t) {
  const u = t - TL.reveal;
  ctx.fillStyle = COL.W;
  ctx.fillRect(0, 0, W, H);
  const zoom = 1.1 - 0.1 * E.outCubic(prog(u, 0, 5));
  const [sx, sy] = shake(t, [TL.reveal], 30, 7);

  camera(zoom, 0, sx, sy, () => {
    // grand disque jaune (coin bas-droit) et anneau vert : écho de l'univers Fata
    const cr = 560 * E.outExpo(prog(u, 0.1, 1.2));
    ctx.fillStyle = COL.Y;
    ctx.beginPath();
    ctx.arc(W + 140, H + 60, cr, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(W + 140, H + 60);
    ctx.rotate(u * 0.25);
    ctx.strokeStyle = COL.G;
    ctx.lineWidth = 6;
    ctx.setLineDash([60, 28]);
    ctx.beginPath();
    ctx.arc(0, 0, cr + 45, 0, Math.PI * 2 * E.outCubic(prog(u, 0.3, 1.6)));
    ctx.stroke();
    ctx.restore();
    // disque jaune haut-gauche, plus petit
    const cr2 = 300 * E.outExpo(prog(u, 0.25, 1.3));
    ctx.fillStyle = COL.Y;
    ctx.beginPath();
    ctx.arc(-80, 120, cr2, 0, Math.PI * 2);
    ctx.fill();
    // grille de points verts
    for (let gy = 0; gy < 4; gy++) for (let gx = 0; gx < 6; gx++) {
      const p = E.outBack(prog(u, 0.6 + (gx + gy) * 0.04, 1.0 + (gx + gy) * 0.04));
      if (p <= 0) continue;
      ctx.fillStyle = COL.G;
      ctx.beginPath();
      ctx.arc(760 + gx * 44, 170 + gy * 44, 6 * p, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(90 + gx * 44, 1590 + gy * 44, 6 * p, 0, Math.PI * 2);
      ctx.fill();
    }

    // ondes de choc derrière le logo
    for (const [d, k, lw] of [[0, "Y", 90], [0.07, "G", 30], [0.14, "K", 4]]) {
      const p = prog(u - d, 0, 0.9);
      if (p <= 0 || p >= 1) continue;
      ctx.strokeStyle = COL[k];
      ctx.globalAlpha = 1 - p;
      ctx.lineWidth = lw * (1 - p) + 1;
      ctx.beginPath();
      ctx.arc(CX, LOGO_Y, 120 + E.outExpo(p) * 1100, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // éclats qui retombent doucement
    for (const c of CONFETTI) {
      const k = 2.6;
      const x = CX + (c.vx * (1 - Math.exp(-k * u))) / k + Math.sin(u * 2 + c.ph) * 18 * clamp(u - 0.5);
      const y = LOGO_Y + (c.vy * (1 - Math.exp(-k * u))) / k + c.fall * u * u * 0.5 + c.fall * u;
      const a = clamp(1 - (u - 1.3) / 1.0) * clamp(u * 10);
      if (a <= 0) continue;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(x, y);
      ctx.rotate(c.rot + c.vr * u);
      drawShape(c.type, c.s, c.k, true, 2);
      ctx.restore();
    }

    drawLogo(u, t);

    // « QUELQUE CHOSE ARRIVE… » puis « RESTEZ CONNECTÉS. »
    const ty = 1165;
    const clipTop = ty - 110, clipH = 220;
    const lineIn = (str, t0, size, colorFn, spacing) => drawLine(str, CX, ty, size, (i, n, c) => {
      const pin = prog(t, t0 + i * 0.024, t0 + 0.5 + i * 0.024);
      if (pin <= 0) return null;
      return { a: 1, dy: (1 - E.outExpo(pin)) * 150, color: colorFn(c) };
    }, "Anton", spacing);
    const lineOut = (t1) => E.inExpo(prog(t, t1, t1 + 0.32));
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, clipTop, W, clipH);
    ctx.clip();
    const s1 = fit("QUELQUE CHOSE ARRIVE", 760, 108, "Anton", 0.02);
    const o1 = lineOut(TL.line2 - 0.2);
    if (o1 < 1) {
      ctx.save();
      ctx.translate(-30, -o1 * 170);
      const r = lineIn("QUELQUE CHOSE ARRIVE", TL.line1, s1, () => COL.K, 0.02);
      ctx.restore();
      // les « … » deviennent un indicateur de chargement jaune
      const dp = prog(t, TL.line1 + 0.55, TL.line1 + 0.75);
      if (dp > 0) dotsLoader(CX - 30 + r.L.total / 2 + 30, ty + r.ch / 2 - 12 - o1 * 170, t, dp);
    }
    if (t >= TL.line2) {
      const s2 = fit("RESTEZ CONNECTÉS.", 820, 116, "Anton", 0.02);
      lineIn("RESTEZ CONNECTÉS.", TL.line2, s2, c => (c === "." ? COL.Y : COL.G), 0.02);
    }
    ctx.restore();

    // trait jaune sous la phrase
    const bw = 140 * E.outExpo(prog(t, TL.line1 + 0.3, TL.line1 + 0.9));
    ctx.fillStyle = COL.Y;
    ctx.fillRect(CX - bw / 2, ty + 112, bw, 10);

    // signature
    const sp = E.outCubic(prog(t, 12.0, 12.8));
    drawLine("FATA SCHOOL", CX, 1500, 46, (i) => ({ a: sp, dy: (1 - sp) * 20, color: COL.K }), "Bebas Neue", 0.32);
  });

  // pulsation finale des accolades
  const st = t - TL.sting;
  if (st > 0 && st < 0.8) {
    const p = E.outExpo(prog(st, 0, 0.8));
    ctx.strokeStyle = COL.Y;
    ctx.globalAlpha = 1 - p;
    ctx.lineWidth = 14 * (1 - p) + 1;
    ctx.beginPath();
    ctx.arc(CX, LOGO_Y, 200 + p * 600, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // flash blanc de révélation
  const fl = Math.exp(-u * 5.5);
  if (fl > 0.01) { ctx.fillStyle = rgba("W", fl); ctx.fillRect(0, 0, W, H); }
  glitch(t, hitEnv(u, 10) * 0.5, 11);
  vignette(0.10);
}

/* ------------------------------------------------------------------ rendu */
function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.shadowBlur = 0;
  if (t < TL.hit1) scene1(t);
  else if (t < TL.tunnel) scene2(t);
  else if (t < TL.stop) scene3(t);
  else if (t < TL.reveal) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); return; } // silence et noir
  else scene4(t);
  drawGrain(t, t >= TL.reveal ? 0.05 : 0.09);
}

async function init() {
  TL = await (await fetch("timeline.json")).json();
  LOGO.parts = await (await fetch("../assets/logo/parts.json")).json();
  await Promise.all(["brace-left", "brace-right", "f", "a1", "t", "a2"].map(n => new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => { LOGO.img[n] = im; res(); };
    im.onerror = rej;
    im.src = `../assets/logo/${n}.png`;
  })));
  logoCv.width = Math.ceil(LOGO_W) + 2;
  logoCv.height = Math.ceil((LOGO.parts.H * LOGO_W) / LOGO.parts.W) + 2;
  await document.fonts.load('100px "Anton"');
  await document.fonts.load('100px "Bebas Neue"');
  makeGrain(); makeFly(); makeDust(); makeTunnel(); makeConfetti();
  window.render = render;
  window.TL = TL;
  window.ready = true;
  if (location.search.includes("play")) {
    document.body.classList.add("preview");
    const start = performance.now();
    const loop = () => { render(((performance.now() - start) / 1000) % TL.duration); requestAnimationFrame(loop); };
    loop();
  } else render(0);
}
init();
