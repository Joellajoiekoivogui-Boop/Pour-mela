"use client";

import { BookOpen, Hammer, PenTool, Rocket, Share2 } from "lucide-react";
import { motion, useScroll, useSpring } from "motion/react";
import { useRef } from "react";
import { CHAPITRES, joel } from "@/config/joel";
import { audio } from "@/lib/audio";
import { ChapterLabel } from "../ui/ChapterLabel";
import { HiddenStar } from "../ui/HiddenStar";
import { SplitText } from "../ui/SplitText";

const ICONS = [BookOpen, PenTool, Share2, Rocket, Hammer];
const ease = [0.22, 1, 0.36, 1] as const;

/** Chapitre 04 — le parcours, en frise verticale dont le fil se dessine au défilement. */
export function Timeline() {
  const c = CHAPITRES[3];
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const line = useSpring(scrollYProgress, { stiffness: 90, damping: 26 });

  return (
    <section id="parcours" data-chapter="parcours" className="section relative px-6 py-32 sm:px-10 md:py-44">
      <div className="mx-auto max-w-6xl">
        <ChapterLabel numero={c.numero} texte={c.sousTitre} />
        <SplitText as="h2" text={joel.parcours.titre} reveal="rise" className="title-xl mt-6" />

        <ol ref={ref} className="relative mt-20 md:mt-28">
          <div aria-hidden className="absolute bottom-0 left-[19px] top-0 w-px bg-white/10 md:left-1/2" />
          <motion.div
            aria-hidden
            className="absolute left-[19px] top-0 h-full w-px origin-top bg-gradient-to-b from-violet-400 via-fuchsia-300 to-white shadow-[0_0_12px_#a78bfa] md:left-1/2"
            style={{ scaleY: line }}
          />

          {joel.parcours.etapes.map((step, i) => {
            const Icon = ICONS[i % ICONS.length];
            const right = i % 2 === 1;
            return (
              <li key={step.titre} className="relative grid grid-cols-[40px_1fr] gap-6 pb-20 last:pb-0 md:grid-cols-2 md:gap-20 md:pb-28">
                <motion.div
                  className="relative z-10 col-start-1 row-start-1 grid h-10 w-10 place-items-center rounded-full border border-violet-300/40 bg-[#0a0a18] text-violet-200 md:absolute md:left-1/2 md:-translate-x-1/2"
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1, boxShadow: "0 0 30px rgba(167,139,250,0.55)" }}
                  viewport={{ once: true, amount: 1, margin: "0px 0px -30% 0px" }}
                  transition={{ type: "spring", stiffness: 260, damping: 16 }}
                  onViewportEnter={() => audio.chime(i * 2, 0.4)}
                >
                  <Icon size={17} strokeWidth={1.6} />
                </motion.div>
                <motion.div
                  className={`col-start-2 row-start-1 md:col-start-auto ${right ? "md:col-start-2 md:pl-4" : "md:col-start-1 md:pr-4 md:text-right"}`}
                  initial={{ opacity: 0, x: right ? 60 : -60, filter: "blur(10px)" }}
                  whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 1.1, ease }}
                >
                  <span className="outline-number font-display text-[clamp(3.5rem,8vw,6.5rem)] font-extrabold leading-none">0{i + 1}</span>
                  <h3 className="mt-2 font-display text-[clamp(1.8rem,4vw,3rem)] font-bold uppercase tracking-tight">{step.titre}</h3>
                  <p className={`mt-3 max-w-md text-lg text-white/65 ${right ? "" : "md:ml-auto"}`}>{step.texte}</p>
                </motion.div>
              </li>
            );
          })}
        </ol>
        <div className="mt-10 flex justify-center md:justify-end">
          <HiddenStar />
        </div>
      </div>
    </section>
  );
}
