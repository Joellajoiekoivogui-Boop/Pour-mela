"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, type PointerEvent } from "react";
import { reine } from "@/config/reine";
import { useSceneOnView } from "@/hooks/useSceneOnView";
import { vibrate } from "@/lib/device";
import { director } from "@/lib/director";
import { music } from "@/lib/music";
import { ChapterLabel } from "../ui/Ornament";
import { SplitText } from "../ui/SplitText";

const AUTO_SPEED = 9; // degrés par seconde

/**
 * Interlude — la galerie de lumière : ses photos en anneau dans l'espace.
 * L'anneau tourne seul ; le doigt le fait pivoter avec de l'élan, un toucher
 * sur une photo l'amène devant. Tout passe par des transformations CSS 3D,
 * calculées par la carte graphique ; la boucle ne tourne que si l'anneau
 * est à l'écran.
 */
export function Gallery() {
  const { galerie } = reine;
  const photos = galerie.photos;
  const count = photos.length;
  const step = 360 / count;
  const section = useRef<HTMLElement>(null);
  const header = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const veils = useRef<(HTMLSpanElement | null)[]>([]);
  const motion = useRef({ angle: 0, velocity: AUTO_SPEED, target: null as number | null, dragging: false, lastX: 0, lastT: 0, moved: 0 });
  const headerInView = useInView(header, { once: true, margin: "-25% 0px" });
  const stageInView = useInView(stage, { margin: "10% 0px" });

  useSceneOnView(section, "sky");

  useEffect(() => {
    if (!stageInView) return;
    let frame = 0;
    let last = performance.now();
    const reduced = director.quality.reducedMotion;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const m = motion.current;
      if (!m.dragging) {
        if (m.target !== null) {
          const diff = m.target - m.angle;
          m.angle += diff * (1 - Math.exp(-dt * 5));
          if (Math.abs(diff) < 0.2) m.target = null;
        } else {
          // L'élan du doigt s'amortit vers la rotation tranquille.
          const cruise = reduced ? 0 : AUTO_SPEED;
          m.velocity += (cruise - m.velocity) * (1 - Math.exp(-dt * 1.2));
          m.angle += m.velocity * dt;
        }
      }
      const radius = ring.current ? ring.current.offsetWidth / 2 / Math.tan(Math.PI / count) + 24 : 300;
      if (ring.current) ring.current.style.transform = `translateZ(${-radius}px) rotateY(${m.angle}deg)`;
      cards.current.forEach((card, i) => {
        if (!card) return;
        card.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`;
        // Face à nous : lumineuse ; de dos : estompée.
        const facing = Math.cos(((m.angle + i * step) * Math.PI) / 180);
        const veil = veils.current[i];
        if (veil) veil.style.opacity = String(Math.min(0.85, Math.max(0, 0.6 - facing * 0.75)));
        card.style.zIndex = String(Math.round(facing * 100) + 100);
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stageInView, count, step]);

  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    const m = motion.current;
    m.dragging = true;
    m.target = null;
    m.lastX = event.clientX;
    m.lastT = performance.now();
    m.moved = 0;
    m.velocity = 0;
  };

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const m = motion.current;
    if (!m.dragging) return;
    const now = performance.now();
    const dx = event.clientX - m.lastX;
    const delta = dx * 0.35;
    m.angle += delta;
    m.velocity = (delta / Math.max(8, now - m.lastT)) * 1000;
    m.moved += Math.abs(dx);
    m.lastX = event.clientX;
    m.lastT = now;
    if (m.moved > 6) event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onUp = () => {
    motion.current.dragging = false;
  };

  const bringToFront = (i: number, card: HTMLButtonElement) => {
    const m = motion.current;
    if (m.moved > 6) return;
    // Le plus court chemin pour amener la photo devant.
    const current = m.angle;
    const goal = -i * step;
    const turns = Math.round((current - goal) / 360);
    m.target = goal + turns * 360;
    const rect = card.getBoundingClientRect();
    director.emit({ kind: "stars", x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    music.note(i + 2);
    vibrate(10);
  };

  return (
    <section ref={section} aria-labelledby="titre-galerie" data-defilement="0.9" className="relative overflow-x-clip py-[16svh]">
      <div ref={header} className="mx-auto mb-10 flex max-w-3xl flex-col items-center gap-6 px-6 text-center">
        <ChapterLabel>{galerie.surtitre}</ChapterLabel>
        <SplitText
          as="h2"
          id="titre-galerie"
          text={galerie.titre}
          state={headerInView ? "visible" : "hidden"}
          effect="rise"
          stagger={0.045}
          className="font-display text-[clamp(1.5rem,6.5vw,3rem)] leading-tight text-gold"
        />
        <p className="legible max-w-md font-serif text-[clamp(1.3rem,5.3vw,1.6rem)] font-medium italic text-champagne">{galerie.consigne}</p>
      </div>

      <div
        ref={stage}
        data-pause="6000"
        data-no-burst
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="relative mx-auto h-[min(68svh,560px)] w-full touch-pan-y select-none"
        style={{ perspective: "1100px", perspectiveOrigin: "50% 40%" }}
      >
        {/* Lueur au sol, comme un reflet */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-[4%] mx-auto h-24 w-[80%] rounded-[50%]"
          style={{ background: "radial-gradient(closest-side, rgb(233 196 106 / 0.28), rgb(255 111 154 / 0.1) 60%, transparent)" }}
        />
        <div className="absolute inset-0 flex items-center justify-center" style={{ transformStyle: "preserve-3d", transform: "rotateX(-6deg)" }}>
          <div
            ref={ring}
            className="relative aspect-[3/4] w-[min(52vw,240px)]"
            style={{ transformStyle: "preserve-3d", willChange: "transform" }}
          >
            {photos.map((photo, i) => (
              <button
                key={photo.src}
                ref={(el) => {
                  cards.current[i] = el;
                }}
                type="button"
                aria-label={`Photo ${i + 1} de ${reine.prenom}`}
                onClick={(event) => bringToFront(i, event.currentTarget)}
                className="royal-border absolute inset-0 overflow-hidden rounded-[1.4rem] p-[2px] shadow-[0_20px_50px_-20px_rgb(255_111_154/0.5)]"
                style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- site statique, sans optimiseur d'images */}
                <img
                  src={photo.src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="h-full w-full rounded-[1.3rem] object-cover"
                  style={{ objectPosition: photo.cadrage }}
                />
                <span aria-hidden className="shine" />
                <span
                  aria-hidden
                  ref={(el) => {
                    veils.current[i] = el;
                  }}
                  className="absolute inset-0 rounded-[1.3rem] bg-nuit"
                  style={{ opacity: 0.5 }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
