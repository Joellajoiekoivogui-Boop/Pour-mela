"use client";

import { RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CHAPITRES, joel } from "@/config/joel";
import { useQuality } from "@/hooks/useQuality";
import { audio } from "@/lib/audio";
import { burst, celebrate, confetti, emit } from "@/lib/fx";
import { stage } from "@/lib/stage";
import { sampleText } from "@/lib/textPoints";
import { ChapterLabel } from "../ui/ChapterLabel";
import { Magnetic } from "../ui/Magnetic";

// Le film de la fin, en millisecondes.
const LIGHT = 1300; // une petite lumière grandit dans le noir
const SPREAD = 2100; // elle éclate en milliers de particules
const SHAPES = [2300, 5600, 8900]; // JOËL, puis 10.10, puis HAPPY BIRTHDAY
const BOOM = 12600; // l'explosion finale
const END = 13400;

const COLORS = ["#ffffff", "#ede9fe", "#c4b5fd", "#a78bfa", "#f5d0fe", "#93c5fd"];

/** Chapitre 08 — l'animation finale et le bouton « Célébrer ». */
export function Finale() {
  const c = CHAPITRES[7];
  const quality = useQuality();
  const section = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);

  // Le film démarre quand la section occupe l'écran.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRun((r) => r || 1);
          observer.disconnect();
        }
      },
      { threshold: 0.55 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!run) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (stage.quality.reducedMotion) {
      const timer = window.setTimeout(() => setDone(true), 0);
      return () => window.clearTimeout(timer);
    }

    const resetTimer = window.setTimeout(() => setDone(false), 0);
    const dpr = Math.min(stage.quality.dpr, 1.5);
    let width = 0;
    let height = 0;
    const n = stage.quality.finale;
    const px = new Float32Array(n);
    const py = new Float32Array(n);
    const vx = new Float32Array(n);
    const vy = new Float32Array(n);
    const size = new Float32Array(n);
    const tint = new Uint8Array(n);
    let targets: Float32Array[] = [];
    let raf = 0;
    let visible = true;
    let start = 0;
    let elapsedBeforePause = 0;
    let shape = -1;
    let boomed = false;
    let ended = false;
    const font = getComputedStyle(document.documentElement).getPropertyValue("--font-sora").trim() || "system-ui, sans-serif";

    const layout = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const portrait = width / height < 0.9;
      targets = joel.final.formes.map((text) => sampleText(portrait ? text.replace(" ", "\n") : text, width, height, n, font));
    };

    for (let i = 0; i < n; i++) {
      size[i] = 0.6 + Math.random() * 1.6;
      tint[i] = (Math.random() * COLORS.length) | 0;
    }

    let lastFrame = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) {
        lastFrame = 0;
        return;
      }
      const t = now - start;
      // Pas de temps fixe : sur un téléphone lent, on rattrape jusqu'à 3 pas
      // par image, pour que les mots se forment toujours à temps.
      const steps = lastFrame ? Math.min(3, Math.max(1, Math.round((now - lastFrame) / 16.7))) : 1;
      lastFrame = now;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(3,3,8,0.32)";
      ctx.fillRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;

      // 1. La lumière.
      if (t < SPREAD + 400) {
        const grow = Math.min(1, t / LIGHT);
        const fade = t < SPREAD ? 1 : 1 - (t - SPREAD) / 400;
        const r = 4 + Math.pow(grow, 3) * Math.min(width, height) * 0.16;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3);
        g.addColorStop(0, `rgba(255,255,255,${fade})`);
        g.addColorStop(0.25, `rgba(196,181,253,${0.7 * fade})`);
        g.addColorStop(1, "rgba(76,29,149,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);
      }
      if (t < SPREAD) return;

      // 2. L'éclatement : toutes les particules jaillissent du centre.
      if (shape === -1) {
        shape = 0;
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2;
          const v = 2 + Math.random() * 14;
          px[i] = cx;
          py[i] = cy;
          vx[i] = Math.cos(a) * v;
          vy[i] = Math.sin(a) * v;
        }
        audio.whoosh(1);
      }

      // 3. Les formes, l'une après l'autre.
      let current = -1;
      for (let s = 0; s < SHAPES.length; s++) if (t >= SHAPES[s]) current = s;
      if (current !== shape && current > 0) {
        shape = current;
        audio.chime(current * 3, 0.9);
        for (let i = 0; i < n; i++) {
          vx[i] += (Math.random() - 0.5) * 9;
          vy[i] += (Math.random() - 0.5) * 9;
        }
      }

      if (t >= BOOM && !boomed) {
        boomed = true;
        for (let i = 0; i < n; i++) {
          const dx = px[i] - cx;
          const dy = py[i] - cy;
          const d = Math.hypot(dx, dy) || 1;
          const v = 6 + Math.random() * 16;
          vx[i] = (dx / d) * v;
          vy[i] = (dy / d) * v - 3;
        }
        emit({ type: "flash", strength: 0.8 });
        confetti({ count: 200 });
        burst({ y: window.innerHeight, count: 140, power: 6, rise: true });
        audio.fanfare();
      }
      if (t >= END && !ended) {
        ended = true;
        setDone(true);
      }

      const target = targets[Math.max(0, current)];
      const pointer = stage.pointer;
      const rect = canvas.getBoundingClientRect();
      const mx = pointer.x - rect.left;
      const my = pointer.y - rect.top;
      const k = 0.022 + Math.min(1, (t - (SHAPES[Math.max(0, current)] ?? 0)) / 2000) * 0.03;

      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < n; i++) {
        for (let step = 0; step < steps; step++) {
          if (!boomed) {
            const tx = target[i * 2] + Math.sin(now * 0.002 + i) * 0.8;
            const ty = target[i * 2 + 1] + Math.cos(now * 0.0017 + i) * 0.8;
            vx[i] += (tx - px[i]) * k;
            vy[i] += (ty - py[i]) * k;
            vx[i] *= 0.84;
            vy[i] *= 0.84;
          } else {
            // Après l'explosion, les particules remontent doucement vers le ciel.
            vx[i] = vx[i] * 0.965 + (Math.random() - 0.5) * 0.08;
            vy[i] = vy[i] * 0.965 - 0.035;
            if (py[i] < -10) {
              py[i] = height + Math.random() * 40;
              px[i] = Math.random() * width;
              vy[i] = -0.5 - Math.random();
              vx[i] = 0;
            }
          }
          if (pointer.active) {
            const dx = px[i] - mx;
            const dy = py[i] - my;
            const d2 = dx * dx + dy * dy;
            if (d2 < 6400) {
              const f = (1 - d2 / 6400) * 2.4;
              const d = Math.sqrt(d2) || 1;
              vx[i] += (dx / d) * f;
              vy[i] += (dy / d) * f;
            }
          }
          px[i] += vx[i];
          py[i] += vy[i];
        }
        ctx.fillStyle = COLORS[tint[i]];
        ctx.globalAlpha = boomed ? 0.55 : 0.9;
        const s = size[i];
        ctx.fillRect(px[i] - s / 2, py[i] - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    };

    const observer = new IntersectionObserver(([entry]) => {
      const now = performance.now();
      if (entry.isIntersecting && !visible) start = now - elapsedBeforePause;
      else if (!entry.isIntersecting && visible) elapsedBeforePause = now - start;
      visible = entry.isIntersecting;
    });

    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      layout();
      ctx.fillStyle = "#030308";
      ctx.fillRect(0, 0, width, height);
      start = performance.now();
      raf = requestAnimationFrame(frame);
      observer.observe(canvas);
    });
    const onResize = () => layout();
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.clearTimeout(resetTimer);
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [run]);

  return (
    <section
      ref={section}
      id="celebration"
      data-chapter="celebration"
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-[#030308] px-6 text-center"
    >
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
      <div className="absolute left-6 top-24 sm:left-10">
        <ChapterLabel numero={c.numero} texte={c.sousTitre} />
      </div>
      <p className="sr-only">
        {joel.final.formes.join(" · ")}. {joel.message.titre}
      </p>

      <AnimatePresence>
        {(done || quality.reducedMotion) && (
          <motion.div
            className="relative z-10 mt-[40vh] flex flex-col items-center gap-5 sm:mt-[44vh]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {quality.reducedMotion && <p className="title-xxl text-gradient -mt-[30vh] mb-[20vh]">Happy Birthday</p>}
            <Magnetic strength={0.45}>
              <button type="button" className="btn-glow btn-xl" onClick={() => celebrate(false)}>
                {joel.final.bouton}
              </button>
            </Magnetic>
            {!quality.reducedMotion && (
              <button type="button" onClick={() => setRun((r) => r + 1)} className="label flex items-center gap-2 text-white/55 transition hover:text-white">
                <RotateCcw size={14} /> {joel.final.rejouer}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
