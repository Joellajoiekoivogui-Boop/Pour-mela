"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { reine } from "@/config/reine";
import { useSceneOnView } from "@/hooks/useSceneOnView";
import { director } from "@/lib/director";
import { CrownIcon } from "../ui/Icons";
import { SplitText } from "../ui/SplitText";
import { Tilt } from "../ui/Tilt";

/**
 * Le portrait, dans une fenêtre en arche : la couronne de lumière descend
 * se poser au-dessus. Sans photo, un médaillon à son initiale la remplace.
 */
export function Portrait() {
  const { photo } = reine.maReine;
  const block = useRef<HTMLDivElement>(null);
  const crownAnchor = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const shown = useRef(false);
  const caption = useRef<HTMLDivElement>(null);
  const captionInView = useInView(caption, { once: true, margin: "-15% 0px" });

  useSceneOnView(block, "crown", crownAnchor);

  const onAppear = () => {
    if (shown.current || !frame.current) return;
    shown.current = true;
    const rect = frame.current.getBoundingClientRect();
    director.emit({ kind: "stars", x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.35, amount: 1.4 });
    director.pulse(1);
  };

  return (
    <div ref={block} className="relative flex flex-col items-center px-6 pb-[18svh] pt-[6svh]">
      <div ref={crownAnchor} aria-hidden className="h-[17svh] w-full" />

      <motion.div
        ref={frame}
        className="relative w-[min(74vw,360px)]"
        initial={{ opacity: 0, y: 80, scale: 0.9, filter: "blur(14px)" }}
        whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-20% 0px" }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        onViewportEnter={() => window.setTimeout(onAppear, 700)}
      >
        {/* Halo qui ondule derrière le cadre */}
        <div
          aria-hidden
          className="morph-blob absolute -inset-[14%] opacity-80"
          style={{ background: "radial-gradient(closest-side, rgb(233 196 106 / 0.35), rgb(255 111 154 / 0.18) 55%, transparent 75%)" }}
        />
        {/* Anneaux en orbite, inclinés en 3D */}
        <div aria-hidden className="pointer-events-none absolute -inset-[18%]" style={{ perspective: 800 }}>
          <div className="absolute inset-0" style={{ transform: "rotateX(72deg)" }}>
            <div className="orbit absolute inset-0 rounded-full border border-or/30">
              <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-or-clair shadow-[0_0_14px_4px_rgb(246_227_180/0.8)]" />
            </div>
          </div>
          <div className="absolute inset-[8%]" style={{ transform: "rotateX(76deg) rotateY(18deg)" }}>
            <div className="orbit-reverse absolute inset-0 rounded-full border border-rose/25">
              <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-rose-pale shadow-[0_0_12px_4px_rgb(255_111_154/0.7)]" />
            </div>
          </div>
        </div>

        <Tilt className="rounded-t-full rounded-b-[2rem]" max={8}>
          <div className="royal-border relative aspect-[3/4] overflow-hidden rounded-t-full rounded-b-[2rem] p-[3px] shadow-[0_30px_80px_-20px_rgb(255_111_154/0.35)]">
            <div className="relative h-full w-full overflow-hidden rounded-t-full rounded-b-[1.8rem] bg-encre">
              {photo.src ? (
                // eslint-disable-next-line @next/next/no-img-element -- site statique, sans optimiseur d'images
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                  style={{ objectPosition: photo.cadrage }}
                />
              ) : (
                <Monogram />
              )}
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-nuit/70 via-transparent to-or/10" />
              <span aria-hidden className="shine" />
            </div>
          </div>
        </Tilt>
      </motion.div>

      <div ref={caption}>
        <SplitText
          text={photo.legende}
          state={captionInView ? "visible" : "hidden"}
          by="word"
          delay={0.4}
          stagger={0.14}
          className="mt-12 max-w-xs text-center font-script text-[clamp(1.9rem,8vw,2.8rem)] leading-tight text-gold glow-gold"
        />
      </div>
    </div>
  );
}

function Monogram() {
  const initial = Array.from(reine.prenom)[0] ?? "♛";
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center"
      style={{ background: "radial-gradient(circle at 50% 35%, #3a1430 0%, #1a0816 55%, #07030a 100%)" }}
      role="img"
      aria-label={reine.maReine.photo.alt}
    >
      <CrownIcon className="h-10 w-10 text-or float-slow" />
      <span className="mt-1 font-script text-[clamp(7rem,34vw,10rem)] leading-[0.9] text-gold text-gold-live glow-gold">{initial}</span>
      <span className="mt-4 font-display text-[0.65rem] uppercase tracking-royal text-champagne/70">{reine.prenom}</span>
      {[12, 28, 46, 64, 82].map((left, i) => (
        <span
          key={left}
          aria-hidden
          className="twinkle absolute h-1 w-1 rounded-full bg-or-clair"
          style={{ left: `${left}%`, top: `${18 + ((i * 37) % 60)}%`, animationDelay: `${i * 0.5}s` }}
        />
      ))}
    </div>
  );
}
