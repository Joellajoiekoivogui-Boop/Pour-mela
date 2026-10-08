"use client";

import { motion } from "motion/react";
import { CHAPITRES, joel } from "@/config/joel";
import { audio } from "@/lib/audio";
import { burst } from "@/lib/fx";
import { ChapterLabel } from "../ui/ChapterLabel";
import { SplitText } from "../ui/SplitText";

// Positions de départ pseudo-aléatoires mais stables (même rendu serveur / client).
function scatter(i: number) {
  const a = Math.sin(i * 12.9898) * 43758.5453;
  const b = Math.sin(i * 78.233) * 12345.678;
  const r1 = a - Math.floor(a);
  const r2 = b - Math.floor(b);
  return { x: (r1 - 0.5) * 900, y: (r2 - 0.5) * 600, rotate: (r1 - 0.5) * 180 };
}

/** Chapitre 07 — le message personnel, puis « Le meilleur reste à construire ». */
export function Letter() {
  const c = CHAPITRES[6];
  const t = joel.lettre;

  return (
    <section id="message" data-chapter="message" className="section relative overflow-hidden px-6 py-40 sm:px-10 md:py-56">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_30%_at_50%_72%,rgba(76,29,149,0.22),transparent_70%)]" />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
        <ChapterLabel numero={c.numero} texte={c.sousTitre} className="justify-center" />
        <SplitText as="p" text={t.ouverture} reveal="blur" className="mt-16 font-display text-[clamp(2.4rem,6vw,4.5rem)] font-light italic text-violet-100" />
        <div className="mt-14 flex flex-col gap-6 md:gap-8">
          {t.lignes.map((line, i) => (
            <SplitText
              key={line}
              as="p"
              by="word"
              reveal="blur"
              text={line}
              stagger={0.12}
              className={`text-[clamp(1.5rem,3.6vw,2.6rem)] leading-snug ${i === t.lignes.length - 1 ? "font-semibold text-white" : "font-light text-white/75"}`}
            />
          ))}
        </div>

        <div className="relative mt-32 md:mt-44">
          <motion.div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-[140%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(139,92,246,0.45),transparent)] blur-2xl"
            initial={{ opacity: 0, scale: 0.3 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 2.2, delay: 1.2 }}
          />
          <motion.h2
            aria-label={t.final}
            className="best-title relative font-display text-[clamp(2.4rem,8.5vw,7.5rem)] font-extrabold leading-[0.95] tracking-tight"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.6 }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.035 } } }}
            onAnimationComplete={(def) => {
              if (def !== "show") return;
              burst({ count: 160, power: 10 });
              audio.fanfare();
            }}
          >
            {t.final
              .toUpperCase()
              .split(" ")
              .reduce<{ word: string; start: number }[]>((acc, word) => {
                const start = acc.length ? acc[acc.length - 1].start + acc[acc.length - 1].word.length + 1 : 0;
                return [...acc, { word, start }];
              }, [])
              .map(({ word, start }) => (
                <span key={start} className="inline-block whitespace-nowrap" aria-hidden>
                  {Array.from(word).map((char, j) => {
                    const s = scatter(start + j);
                    return (
                      <motion.span
                        key={j}
                        className="grad-char inline-block"
                        variants={{
                          hidden: { opacity: 0, x: s.x, y: s.y, rotate: s.rotate, scale: 0.3, filter: "blur(16px)" },
                          show: { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, filter: "blur(0px)" },
                        }}
                        transition={{ type: "spring", stiffness: 70, damping: 14, mass: 0.9 }}
                      >
                        {char}
                      </motion.span>
                    );
                  })}
                  &nbsp;
                </span>
              ))}
          </motion.h2>
        </div>
      </div>
    </section>
  );
}
