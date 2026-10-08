"use client";

import { useEffect, useRef } from "react";
import { PALETTES, stage } from "@/lib/stage";

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  depth: number;
  life: number;
  max: number;
  twinkle: number;
  mix: number;
}

/**
 * Le ciel de fond, fixe derrière tout le site : de petites étoiles et des
 * particules qui naissent, dérivent, s'écartent de la souris, se relient
 * parfois entre elles, puis s'éteignent. La couleur suit le chapitre,
 * la vitesse suit le défilement.
 */
export function ParticleBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const q = stage.quality;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    const color = [...PALETTES.accueil.a] as number[];
    const color2 = [...PALETTES.accueil.b] as number[];

    const spawn = (dot: Partial<Dot> = {}, fresh = false): Dot => {
      const depth = 0.3 + Math.random() * 0.7;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18 * depth,
        vy: (Math.random() - 0.5) * 0.18 * depth - 0.05 * depth,
        r: 0.5 + depth * 1.5,
        depth,
        life: fresh ? Math.random() * 600 : 0,
        max: 500 + Math.random() * 900,
        twinkle: Math.random() * Math.PI * 2,
        mix: Math.random(),
        ...dot,
      };
    };

    let dots: Dot[] = [];
    let stars: Float32Array = new Float32Array(0);

    const resize = () => {
      dpr = q.dpr;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const area = (width * height) / (1440 * 900);
      const count = Math.round(q.ambient * Math.min(1.2, Math.max(0.45, area)));
      dots = Array.from({ length: count }, () => spawn({}, true));
      const starCount = Math.round(count * 1.6);
      stars = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        stars[i * 3] = Math.random() * width;
        stars[i * 3 + 1] = Math.random() * height;
        stars[i * 3 + 2] = Math.random() * Math.PI * 2;
      }
    };

    const frame = (time: number) => {
      raf = requestAnimationFrame(frame);
      if (!running) return;
      const t = time * 0.001;
      const palette = PALETTES[stage.chapter] ?? PALETTES.accueil;
      for (let i = 0; i < 3; i++) {
        color[i] += (palette.a[i] - color[i]) * 0.02;
        color2[i] += (palette.b[i] - color2[i]) * 0.02;
      }
      const ignition = stage.ignition;
      const party = stage.party;
      const calm = q.reducedMotion ? 0.25 : 1;
      const speed = calm * (1 + party * 2.5);
      const scroll = q.reducedMotion ? 0 : Math.max(-40, Math.min(40, stage.scrollVelocity));
      const pointer = stage.pointer;

      ctx.clearRect(0, 0, width, height);
      if (ignition <= 0.001) return;

      // Petites étoiles fixes qui scintillent.
      ctx.fillStyle = "#fff";
      for (let i = 0; i < stars.length; i += 3) {
        let y = stars[i + 1] - scroll * 0.08;
        if (y < 0) y += height;
        else if (y > height) y -= height;
        stars[i + 1] = y;
        const a = (0.25 + 0.35 * Math.sin(t * 1.3 + stars[i + 2])) * ignition;
        if (a <= 0.02) continue;
        ctx.globalAlpha = a;
        ctx.fillRect(stars[i], y, 1, 1);
      }

      // Particules vivantes.
      const [r1, g1, b1] = color;
      const [r2, g2, b2] = color2;
      for (const d of dots) {
        d.life += speed;
        if (d.life > d.max) Object.assign(d, spawn());
        if (!q.reducedMotion && pointer.active) {
          const dx = d.x - pointer.x;
          const dy = d.y - pointer.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 22000) {
            const force = (1 - dist2 / 22000) * 0.6 * d.depth;
            const dist = Math.sqrt(dist2) || 1;
            d.vx += (dx / dist) * force * 0.12;
            d.vy += (dy / dist) * force * 0.12;
          }
        }
        d.vx *= 0.985;
        d.vy *= 0.985;
        d.vx += (Math.random() - 0.5) * 0.004;
        d.vy += (Math.random() - 0.5) * 0.004 - 0.0006;
        d.x += d.vx * speed;
        d.y += d.vy * speed - scroll * d.depth * 0.35;
        if (d.x < -20) d.x = width + 20;
        else if (d.x > width + 20) d.x = -20;
        if (d.y < -20) d.y = height + 20;
        else if (d.y > height + 20) d.y = -20;
      }

      if (q.links) {
        ctx.lineWidth = 0.6;
        for (let i = 0; i < dots.length; i++) {
          const a = dots[i];
          for (let j = i + 1; j < dots.length; j++) {
            const b = dots[j];
            const dx = a.x - b.x;
            if (dx > 110 || dx < -110) continue;
            const dy = a.y - b.y;
            const dist2 = dx * dx + dy * dy;
            if (dist2 > 12100) continue;
            const alpha = (1 - dist2 / 12100) * 0.16 * ignition * Math.min(fade(a), fade(b));
            if (alpha < 0.01) continue;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = `rgb(${r1 | 0},${g1 | 0},${b1 | 0})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const d of dots) {
        const alpha = fade(d) * (0.45 + 0.4 * Math.sin(t * 1.7 + d.twinkle)) * ignition;
        if (alpha < 0.01) continue;
        const m = d.mix;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${(r1 + (r2 - r1) * m) | 0},${(g1 + (g2 - g1) * m) | 0},${(b1 + (b2 - b1) * m) | 0})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * (1 + party * 0.6), 0, Math.PI * 2);
        ctx.fill();
        if (d.depth > 0.85) {
          ctx.globalAlpha = alpha * 0.18;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const fade = (d: Dot) => Math.min(1, d.life / 120, (d.max - d.life) / 160);
    const onVisibility = () => {
      running = !document.hidden;
    };

    resize();
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0 h-full w-full" />;
}
