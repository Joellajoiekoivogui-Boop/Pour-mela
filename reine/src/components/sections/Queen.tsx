"use client";

import { motion, useInView, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { reine } from "@/config/reine";
import { useSceneOnView } from "@/hooks/useSceneOnView";
import { director } from "@/lib/director";
import { ChapterLabel, Ornament } from "../ui/Ornament";
import { SplitText } from "../ui/SplitText";
import { Portrait } from "./Portrait";

/**
 * Chapitre I — Ma Reine : une couronne de lumière se forme au-dessus de son
 * prénom, qui s'élève lettre par lettre.
 */
export function Queen() {
  const { maReine } = reine;
  const hero = useRef<HTMLElement>(null);
  const crownAnchor = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const accrocheRef = useRef<HTMLParagraphElement>(null);
  const accrocheInView = useInView(accrocheRef, { once: true, margin: "-10% 0px" });
  const { scrollYProgress } = useScroll({ target: hero, offset: ["start start", "end start"] });
  const nameY = useTransform(scrollYProgress, [0, 1], ["0%", "-35%"]);
  const nameOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  useSceneOnView(hero, "crown", crownAnchor);

  // Juste après le saut : la couronne se forme, puis le prénom s'élève.
  useEffect(() => {
    director.setScene("crown", crownAnchor.current);
    const timer = window.setTimeout(() => setRevealed(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section id="ma-reine" aria-labelledby="titre-reine">
      <motion.header
        ref={hero}
        className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 pb-[8svh] pt-[calc(var(--safe-top)+9svh)] text-center"
        style={{ y: nameY, opacity: nameOpacity }}
      >
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 1.2 }}>
          <ChapterLabel>{maReine.chapitre}</ChapterLabel>
        </motion.div>

        <div ref={crownAnchor} aria-hidden className="h-[24svh] w-full" />

        <SplitText
          as="p"
          text={maReine.titre}
          state={revealed ? "visible" : "hidden"}
          effect="rise"
          stagger={0.08}
          className="font-display text-[clamp(0.95rem,4vw,1.5rem)] uppercase tracking-royal text-or-clair"
        />
        <h1 id="titre-reine" className="mt-1">
          <SplitText
            as="span"
            text={reine.prenom}
            state={revealed ? "visible" : "hidden"}
            effect="rise"
            delay={0.35}
            stagger={0.11}
            duration={1.3}
            className="block py-2 font-script text-[clamp(5rem,25vw,11.5rem)] leading-[1.05] text-gold text-gold-live glow-gold"
          />
          <SplitText
            as="span"
            text={reine.suiteDuNom}
            state={revealed ? "visible" : "hidden"}
            effect="blur"
            delay={1.1}
            stagger={0.06}
            className="block font-display text-[clamp(0.95rem,4vw,1.35rem)] uppercase tracking-royal text-champagne"
          />
        </h1>

        <Ornament show={revealed} className="mt-7" />

        <motion.p
          ref={accrocheRef}
          className="legible mt-7 max-w-md font-serif text-[clamp(1.32rem,5.4vw,1.65rem)] font-medium italic leading-relaxed text-champagne"
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={revealed && accrocheInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
          transition={{ delay: 2.1, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {maReine.accroche}
        </motion.p>

        <motion.div
          aria-hidden
          className="mt-10 flex flex-col items-center gap-3 font-display text-[0.7rem] uppercase tracking-[0.4em] text-champagne/65"
          initial={{ opacity: 0 }}
          animate={revealed ? { opacity: 1 } : undefined}
          transition={{ delay: 3.4, duration: 1.5 }}
        >
          Défiler
          <span className="relative block h-12 w-px overflow-hidden bg-champagne/15">
            <motion.span
              className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-transparent via-or-clair to-transparent"
              animate={{ y: ["-100%", "200%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
        </motion.div>
      </motion.header>

      <Portrait />
    </section>
  );
}
