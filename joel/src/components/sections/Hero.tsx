"use client";

import { motion, useInView, useScroll, useTransform } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { joel } from "@/config/joel";
import { useQuality } from "@/hooks/useQuality";
import { audio } from "@/lib/audio";
import { stage } from "@/lib/stage";
import { Magnetic } from "../ui/Magnetic";
import { useAudioOn } from "../ui/SoundToggle";
import { scrollToChapter } from "../ui/Nav";

const Orb = dynamic(() => import("../fx/Orb"), { ssr: false });
const ease = [0.22, 1, 0.36, 1] as const;

// Les étapes de l'ouverture (en millisecondes) : le noir, une lumière,
// les particules, « 10.10 », le prénom, la phrase, l'invitation.
const STEPS = [0, 500, 1700, 2500, 3700, 4500];

/** Chapitre 01 — l'entrée dans l'univers. */
export function Hero() {
  const quality = useQuality();
  const section = useRef<HTMLElement>(null);
  const inView = useInView(section, { amount: 0.05 });
  const [step, setStep] = useState(0);
  const audioOn = useAudioOn();

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end start"] });
  const nameScale = useTransform(scrollYProgress, [0, 1], [1, 0.75]);
  const nameY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const blur = useTransform(scrollYProgress, [0, 0.7], ["blur(0px)", "blur(12px)"]);
  const orbY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);

  useEffect(() => {
    if (quality.reducedMotion) {
      stage.ignition = 1;
      const timer = window.setTimeout(() => setStep(STEPS.length), 0);
      return () => window.clearTimeout(timer);
    }
    const timers = STEPS.map((at, i) => window.setTimeout(() => setStep((s) => Math.max(s, i + 1)), at));
    // L'univers s'allume progressivement (lu par le fond de particules).
    const start = performance.now() + 1300;
    let raf = 0;
    const ignite = (now: number) => {
      stage.ignition = Math.min(1, Math.max(stage.ignition, (now - start) / 1800));
      if (stage.ignition < 1) raf = requestAnimationFrame(ignite);
    };
    raf = requestAnimationFrame(ignite);
    return () => {
      timers.forEach(window.clearTimeout);
      cancelAnimationFrame(raf);
    };
  }, [quality.reducedMotion]);

  const skip = () => {
    if (step >= STEPS.length) return;
    setStep(STEPS.length);
    stage.ignition = 1;
  };

  const name = joel.prenom.toUpperCase();
  return (
    <section
      id="accueil"
      ref={section}
      data-chapter="accueil"
      onClick={skip}
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 text-center"
    >
      {/* La toute première lumière. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
        initial={{ scale: 0, opacity: 0 }}
        animate={step >= 2 ? { scale: [1, 60], opacity: [1, 0] } : step >= 1 ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: step >= 2 ? 1.6 : 1.1, ease }}
        style={{ boxShadow: "0 0 30px 8px #c4b5fd, 0 0 90px 30px rgba(139,92,246,0.5)" }}
      />

      <motion.div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center" style={{ y: orbY }}>
        <motion.div
          className="aspect-square w-[min(115vw,820px)]"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={step >= 4 ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 2.4, ease }}
        >
          {quality.webgl ? <Orb active={inView} /> : <div className="orb-fallback h-full w-full" />}
        </motion.div>
      </motion.div>

      <motion.div className="relative z-10 flex flex-col items-center" style={{ scale: nameScale, y: nameY, opacity: fade, filter: blur }}>
        <motion.p
          className="font-mono-ui text-[clamp(1rem,2.6vw,1.5rem)] font-medium tracking-[0.5em] text-violet-200/90"
          initial={{ opacity: 0, filter: "blur(10px)", letterSpacing: "1.4em" }}
          animate={step >= 3 ? { opacity: 1, filter: "blur(0px)", letterSpacing: "0.5em" } : {}}
          transition={{ duration: 1.6, ease }}
        >
          10.10
        </motion.p>

        <h1 className="hero-name mt-3 font-display font-extrabold leading-[0.85]" aria-label={joel.prenom}>
          {Array.from(name).map((char, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="hero-char inline-block"
              initial={{ opacity: 0, y: 60, scale: 1.25, filter: "blur(24px)" }}
              animate={step >= 4 ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" } : {}}
              transition={{ duration: 1.6, delay: i * 0.12, ease }}
            >
              {char}
            </motion.span>
          ))}
        </h1>

        <motion.p
          className="mt-6 max-w-xl text-[clamp(1.1rem,2.4vw,1.6rem)] font-light text-white/80"
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={step >= 5 ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 1.2, ease }}
        >
          {joel.intro.sousTitre}
        </motion.p>
        <motion.p
          className="label mt-3 text-white/45"
          initial={{ opacity: 0 }}
          animate={step >= 5 ? { opacity: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.4 }}
        >
          — 10 octobre —
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={step >= 6 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease }}
        >
          {!audioOn && (
            <Magnetic>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  audio.toggle();
                  audio.whoosh();
                }}
                className="btn-glow"
              >
                {joel.intro.son}
              </button>
            </Magnetic>
          )}
        </motion.div>
      </motion.div>

      <motion.div className="absolute bottom-[calc(var(--safe-bottom)+28px)] z-10" style={{ opacity: fade }}>
        <motion.button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            scrollToChapter("compte-a-rebours");
          }}
          className="label flex flex-col items-center gap-3 text-white/60 transition-colors hover:text-white"
          initial={{ opacity: 0 }}
          animate={step >= 6 ? { opacity: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.3 }}
        >
          {joel.intro.invitation}
          <span className="scroll-cue" aria-hidden />
        </motion.button>
      </motion.div>
    </section>
  );
}
