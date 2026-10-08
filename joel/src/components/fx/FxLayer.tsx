"use client";

import { useEffect, useRef } from "react";
import { onFx, PARTY_COLORS, type BurstOptions } from "@/lib/fx";
import { stage } from "@/lib/stage";

interface Bit {
  kind: 0 | 1 | 2; // 0 étincelle · 1 confetti · 2 particule qui monte
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  spin: number;
  angle: number;
}

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

const MAX = 1400;

/**
 * Couche d'effets au-dessus du contenu (ne bloque jamais les clics) :
 * étincelles, confettis, particules qui remontent, éclairs et étoiles
 * filantes. Elle ne dessine que lorsqu'il y a quelque chose à montrer.
 */
export function FxLayer() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const bits: Bit[] = [];
    const shooting: Star[] = [];
    let flash = 0;
    let lastFlash = 0;
    let raf = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = stage.quality.dpr;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const scale = () => (stage.quality.reducedMotion ? 0.25 : stage.quality.tier === "low" ? 0.5 : stage.quality.tier === "mid" ? 0.75 : 1);

    const add = (bit: Bit) => {
      if (bits.length >= MAX) bits.shift();
      bits.push(bit);
    };

    const sparks = (o: BurstOptions) => {
      const x = o.x ?? width / 2;
      const y = o.y ?? height / 2;
      const count = Math.round((o.count ?? 80) * scale());
      const colors = o.colors ?? PARTY_COLORS;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const v = (o.power ?? 7) * (0.3 + Math.random() * 0.8);
        add({
          kind: o.rise ? 2 : 0,
          x,
          y,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v - (o.rise ? 2 : 0),
          life: 0,
          max: 50 + Math.random() * 60,
          size: 1 + Math.random() * 2.2,
          color: colors[(Math.random() * colors.length) | 0],
          spin: 0,
          angle: 0,
        });
      }
    };

    const confetti = (o: BurstOptions) => {
      const count = Math.round((o.count ?? 160) * scale());
      const colors = o.colors ?? PARTY_COLORS;
      const from =
        o.x !== undefined
          ? [[o.x, o.y ?? height]]
          : [
              [0, height],
              [width, height],
            ];
      for (let i = 0; i < count; i++) {
        const [sx, sy] = from[i % from.length];
        const toward = sx < width / 2 ? 1 : -1;
        const angle = -Math.PI / 2 + toward * (0.15 + Math.random() * 0.55) * (from.length > 1 ? 1 : Math.random() * 2 - 1);
        const v = (o.power ?? 16) * (0.55 + Math.random() * 0.6) * Math.min(1.2, height / 800 + 0.3);
        add({
          kind: 1,
          x: sx,
          y: sy,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v,
          life: 0,
          max: 160 + Math.random() * 120,
          size: 5 + Math.random() * 6,
          color: colors[(Math.random() * colors.length) | 0],
          spin: (Math.random() - 0.5) * 0.3,
          angle: Math.random() * Math.PI,
        });
      }
    };

    const frame = () => {
      raf = 0;
      ctx.clearRect(0, 0, width, height);
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        b.life++;
        if (b.life > b.max || b.y > height + 40) {
          bits.splice(i, 1);
          continue;
        }
        const k = 1 - b.life / b.max;
        if (b.kind === 1) {
          b.vx *= 0.985;
          b.vy = b.vy * 0.985 + 0.22;
          b.angle += b.spin;
          b.x += b.vx + Math.sin(b.life * 0.1 + b.size) * 0.6;
          b.y += b.vy;
          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.rotate(b.angle);
          ctx.scale(1, Math.cos(b.life * 0.15 + b.size));
          ctx.globalAlpha = Math.min(1, k * 3);
          ctx.fillStyle = b.color;
          ctx.fillRect(-b.size / 2, -b.size / 4, b.size, b.size / 2);
          ctx.restore();
        } else {
          b.vx *= 0.95;
          b.vy = b.vy * 0.95 + (b.kind === 2 ? -0.06 : 0.05);
          b.x += b.vx;
          b.y += b.vy;
          ctx.globalAlpha = k;
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = k * 0.25;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.size * 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (let i = shooting.length - 1; i >= 0; i--) {
        const s = shooting[i];
        s.life++;
        s.x += s.vx;
        s.y += s.vy;
        if (s.life > 90) {
          shooting.splice(i, 1);
          continue;
        }
        const tail = 18;
        const gradient = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * tail, s.y - s.vy * tail);
        gradient.addColorStop(0, "rgba(255,255,255,0.95)");
        gradient.addColorStop(0.3, "rgba(196,181,253,0.5)");
        gradient.addColorStop(1, "rgba(139,92,246,0)");
        ctx.globalAlpha = Math.min(1, (90 - s.life) / 20);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * tail, s.y - s.vy * tail);
        ctx.stroke();
        if (s.life % 2 === 0) {
          add({ kind: 0, x: s.x, y: s.y, vx: Math.random() - 0.5, vy: Math.random(), life: 0, max: 40, size: 1.2, color: "#e9d5ff", spin: 0, angle: 0 });
        }
      }

      if (flash > 0.005) {
        ctx.globalAlpha = flash;
        const g = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.7);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.4, "rgba(196,181,253,0.8)");
        g.addColorStop(1, "rgba(76,29,149,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);
        flash *= Math.pow(0.92, Math.max(1, (performance.now() - lastFlash) / 16.7));
        lastFlash = performance.now();
      } else flash = 0;
      ctx.globalAlpha = 1;
      if (bits.length || shooting.length || flash) raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
    const off = onFx((event) => {
      if (event.type === "burst") sparks(event.options);
      else if (event.type === "confetti") confetti(event.options);
      else if (event.type === "flash") {
        flash = Math.min(1, flash + event.strength * (stage.quality.reducedMotion ? 0.3 : 1));
        lastFlash = performance.now();
      } else if (event.type === "shooting-star") {
        const fromLeft = Math.random() < 0.5;
        shooting.push({
          x: fromLeft ? -40 : width + 40,
          y: height * (0.08 + Math.random() * 0.25),
          vx: (fromLeft ? 1 : -1) * (width / 70),
          vy: height / 260,
          life: 0,
        });
      } else return;
      wake();
    });
    return () => {
      off();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[60] h-full w-full" />;
}
