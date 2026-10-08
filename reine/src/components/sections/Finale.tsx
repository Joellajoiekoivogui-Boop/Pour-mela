"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { reine } from "@/config/reine";
import { useDirector } from "@/hooks/useDirector";
import { useSceneOnView } from "@/hooks/useSceneOnView";
import { vibrate } from "@/lib/device";
import { director } from "@/lib/director";
import { music } from "@/lib/music";
import { ReplayIcon, StarIcon } from "../ui/Icons";
import { ChapterLabel, Ornament } from "../ui/Ornament";
import { RoyalButton } from "../ui/RoyalButton";
import { SplitText } from "../ui/SplitText";

const numberFormat = new Intl.NumberFormat("fr-FR");

/**
 * Chapitre V — la révélation : un cœur de lumière bat au rythme de la
 * musique, le message s'écrit ligne après ligne, puis tout s'embrase et son
 * prénom renaît des étincelles.
 */
export function Finale({ onReplay }: { onReplay: () => void }) {
  const { final } = reine;
  const lines = final.lignes;
  const section = useRef<HTMLElement>(null);
  const heartAnchor = useRef<HTMLDivElement>(null);
  const nameAnchor = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const [phase, setPhase] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const climax = phase > lines.length;
  const glActive = useDirector((d) => d.glActive);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });

  // Le défilement fait avancer l'histoire ; on ne revient jamais en arrière.
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    let target = 0;
    lines.forEach((_, i) => {
      if (v > 0.06 + (i * 0.44) / lines.length) target = i + 1;
    });
    if (v > 0.6) target = lines.length + 1;
    setPhase((p) => Math.max(p, target));
  });

  useSceneOnView(section, climax ? "finale" : "heart", climax ? nameAnchor : heartAnchor);

  // Sans musique, le cœur bat quand même.
  useEffect(() => {
    if (climax) return;
    const timer = window.setInterval(() => {
      if (music.started && music.enabled) return;
      director.pulse(1);
      window.setTimeout(() => director.pulse(0.6), 300);
    }, 1200);
    return () => window.clearInterval(timer);
  }, [climax]);

  // L'embrasement.
  useEffect(() => {
    if (!climax) return;
    const list = timers.current;
    music.setIntensity(2);
    music.fanfare();
    director.explode(2.6);
    vibrate([30, 50, 30, 50, 120]);
    for (let k = 0; k < 7; k++) {
      list.push(
        window.setTimeout(() => {
          director.emit({
            kind: "firework",
            x: window.innerWidth * (0.15 + Math.random() * 0.7),
            y: window.innerHeight * (0.12 + Math.random() * 0.45),
          });
        }, 200 + k * 430),
      );
    }
    list.push(window.setTimeout(() => director.setScene("finale", nameAnchor.current), 900));
    list.push(window.setTimeout(() => setRevealed(true), 2500));
  }, [climax]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  return (
    <section id="revelation" data-defilement="0.8" ref={section} aria-labelledby="titre-revelation" className="relative h-[360svh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden px-6 text-center">
        <div className="absolute inset-x-0 top-[calc(var(--safe-top)+7svh)] flex justify-center">
          <ChapterLabel>{final.chapitre}</ChapterLabel>
        </div>
        <h2 id="titre-revelation" className="sr-only">
          Révélation
        </h2>

        {/* Le cœur et le message */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center"
          animate={climax ? { opacity: 0, y: -40, filter: "blur(12px)" } : { opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div ref={heartAnchor} aria-hidden className="mt-[15svh] h-[33svh] w-full" />
          <div className="mt-[3svh] flex max-w-3xl flex-col gap-3 sm:gap-4">
            {lines.map((line, i) => (
              <SplitText
                key={i}
                text={line}
                state={phase > i ? "visible" : "hidden"}
                stagger={0.03}
                duration={1}
                className={
                  i === 0
                    ? "legible font-serif text-[clamp(1.6rem,6.6vw,2.7rem)] italic leading-snug text-champagne"
                    : "legible font-serif text-[clamp(1.9rem,7.8vw,3.3rem)] font-medium leading-tight text-or-clair"
                }
              />
            ))}
          </div>
          <p
            aria-hidden
            className="absolute bottom-[calc(var(--safe-bottom)+6svh)] font-display text-[0.72rem] uppercase tracking-[0.35em] text-champagne/70 transition-opacity duration-700"
            style={{ opacity: phase === 0 ? 1 : 0 }}
          >
            <span className="animate-pulse">Continue de défiler</span>
          </p>
        </motion.div>

        {/* Après l'embrasement : son prénom renaît */}
        {climax ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center pb-[4svh]">
            <div ref={nameAnchor} className="flex h-[24svh] w-full items-center justify-center" aria-hidden={glActive}>
              {!glActive ? (
                <SplitText
                  as="span"
                  text={reine.prenom}
                  state="visible"
                  effect="glow"
                  delay={0.8}
                  stagger={0.12}
                  duration={1.4}
                  className="font-script text-[clamp(5rem,25vw,11rem)] leading-none text-gold text-gold-live glow-gold"
                />
              ) : (
                <span className="sr-only">{reine.prenom}</span>
              )}
            </div>
            {revealed ? <Epilogue onReplay={onReplay} /> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Epilogue({ onReplay }: { onReplay: () => void }) {
  const { final } = reine;
  const [wish, setWish] = useState(-1);
  const [lights, setLights] = useState(director.stats.lights);

  useEffect(() => {
    const timer = window.setInterval(() => setLights(director.stats.lights), 120);
    return () => window.clearInterval(timer);
  }, []);

  const makeWish = (center: { x: number; y: number }) => {
    director.emit({ kind: "firework", x: center.x, y: center.y - 40 });
    for (let k = 1; k <= 2; k++) {
      window.setTimeout(() => {
        director.emit({ kind: "firework", x: window.innerWidth * (0.2 + Math.random() * 0.6), y: window.innerHeight * (0.15 + Math.random() * 0.3) });
      }, k * 380);
    }
    director.pulse(1);
    music.bloom(1);
    vibrate([15, 40, 25]);
    setWish((w) => (w + 1) % final.voeux.length);
  };

  return (
    <div className="flex w-full flex-col items-center">
      <SplitText
        text={reine.suiteDuNom}
        state="visible"
        effect="rise"
        stagger={0.07}
        className="font-display text-[clamp(1rem,4.2vw,1.45rem)] uppercase tracking-royal text-gold"
      />
      <Ornament className="mt-5" />
      <SplitText
        text={final.apresLeNom}
        state="visible"
        by="word"
        delay={0.8}
        stagger={0.2}
        duration={1.2}
        className="legible mt-5 font-serif text-[clamp(1.45rem,6vw,1.95rem)] italic text-champagne"
      />

      {reine.signature ? (
        <motion.div
          className="mt-6 flex flex-col items-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 1.2 }}
        >
          <span className="font-script text-[clamp(2.2rem,9vw,3.2rem)] leading-none text-rose-pale">— {reine.signature}</span>
          <svg viewBox="0 0 200 20" className="h-4 w-40 text-or" aria-hidden>
            <motion.path
              d="M5 12c30-10 55 8 85 2s50-12 70-4 25 6 35 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 2.4, duration: 1.6, ease: "easeInOut" }}
            />
          </svg>
        </motion.div>
      ) : null}

      <motion.div
        className="mt-8 flex flex-wrap items-center justify-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3.4, duration: 1.2 }}
      >
        <RoyalButton onClick={makeWish} icon={<StarIcon className="h-4 w-4 text-or" />}>
          {final.voeu}
        </RoyalButton>
        <RoyalButton variant="ghost" onClick={() => onReplay()} icon={<ReplayIcon className="h-4 w-4" />}>
          {final.rejouer}
        </RoyalButton>
      </motion.div>

      <div className="mt-5 min-h-[3.5rem] max-w-sm" aria-live="polite">
        <AnimatePresence mode="wait">
          {wish >= 0 ? (
            <motion.p
              key={wish}
              className="legible font-serif text-xl italic text-or-clair"
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
              transition={{ duration: 0.7 }}
            >
              {final.voeux[wish]}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      {lights > 0 ? (
        <motion.p
          className="mt-2 font-display text-[0.68rem] uppercase leading-relaxed tracking-[0.24em] text-champagne/65"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.2, duration: 1.5 }}
        >
          {numberFormat.format(lights)} mouvements de lumière
          <br />
          ont dansé rien que pour toi
        </motion.p>
      ) : null}
    </div>
  );
}
