"use client";

import { motion, useInView, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { reine } from "@/config/reine";
import { useSceneOnView } from "@/hooks/useSceneOnView";
import { director } from "@/lib/director";
import { music } from "@/lib/music";
import { MemoryIcon } from "../ui/Icons";
import { ChapterLabel } from "../ui/Ornament";
import { SplitText } from "../ui/SplitText";
import { Tilt } from "../ui/Tilt";

type Memory = (typeof reine.souvenirs.liste)[number];

/**
 * Chapitre III — la frise des souvenirs : un fil d'or se dessine au
 * défilement et chaque souvenir s'allume en passant.
 */
export function Memories() {
  const { souvenirs } = reine;
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLDivElement>(null);
  const headerInView = useInView(header, { once: true, margin: "-25% 0px" });
  const { scrollYProgress } = useScroll({ target: track, offset: ["start 0.62", "end 0.62"] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });
  const headTop = useTransform(progress, (v) => `${v * 100}%`);

  useSceneOnView(section, "sky");

  return (
    <section id="souvenirs" data-defilement="0.85" ref={section} aria-labelledby="titre-souvenirs" className="relative px-5 py-[18svh]">
      <div ref={header} className="mx-auto mb-[12svh] flex max-w-3xl flex-col items-center gap-6 text-center">
        <ChapterLabel>{souvenirs.chapitre}</ChapterLabel>
        <SplitText
          as="h2"
          id="titre-souvenirs"
          text={souvenirs.titre}
          state={headerInView ? "visible" : "hidden"}
          effect="rise"
          stagger={0.045}
          className="font-display text-[clamp(1.5rem,6.5vw,3rem)] leading-tight text-gold"
        />
      </div>

      <div ref={track} className="relative mx-auto max-w-5xl">
        {/* Le fil du temps */}
        <div aria-hidden className="absolute bottom-0 left-[22px] top-0 w-px bg-champagne/10 md:left-1/2" />
        <motion.div
          aria-hidden
          className="absolute bottom-0 left-[22px] top-0 w-[2px] -translate-x-[0.5px] origin-top bg-gradient-to-b from-or via-or-clair to-rose shadow-[0_0_14px_rgb(233_196_106/0.7)] md:left-1/2"
          style={{ scaleY: progress }}
        />
        <motion.div aria-hidden className="absolute left-[22px] z-10 md:left-1/2" style={{ top: headTop }}>
          <span className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-champagne shadow-[0_0_18px_6px_rgb(246_227_180/0.85),0_0_40px_14px_rgb(255_111_154/0.35)]" />
        </motion.div>

        <ol className="relative">
          {souvenirs.liste.map((memory, i) => (
            <MemoryItem key={memory.titre} memory={memory} index={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function MemoryItem({ memory, index }: { memory: Memory; index: number }) {
  const node = useRef<HTMLSpanElement>(null);
  const left = index % 2 === 0;
  const photo =
    "photo" in memory && memory.photo
      ? { src: memory.photo, cadrage: "cadrage" in memory ? memory.cadrage : "50% 30%" }
      : null;

  const onEnter = () => {
    const rect = node.current?.getBoundingClientRect();
    if (!rect) return;
    director.emit({ kind: "stars", x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, amount: 0.8 });
    music.twinkle(0.9);
  };

  return (
    <li className="relative grid py-[7svh] md:grid-cols-2 md:gap-20">
      <motion.span
        ref={node}
        aria-hidden
        className="absolute left-[22px] top-[calc(7svh+2.2rem)] z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full border border-or-clair bg-nuit md:left-1/2"
        initial={{ scale: 0.4, opacity: 0.4 }}
        whileInView={{ scale: 1, opacity: 1, backgroundColor: "#f6e3b4", boxShadow: "0 0 18px 5px rgba(233,196,106,0.7)" }}
        viewport={{ once: true, margin: "-45% 0px -45% 0px" }}
        transition={{ duration: 0.8 }}
        onViewportEnter={onEnter}
      />
      <motion.article
        className={`pl-14 md:pl-0 ${left ? "md:col-start-1 md:text-right" : "md:col-start-2"}`}
        style={{ perspective: 1000 }}
        initial={{ opacity: 0, y: 70, rotateX: -16, filter: "blur(10px)" }}
        whileInView={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-18% 0px" }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <Tilt className="rounded-[1.75rem]">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-or/15 bg-[linear-gradient(145deg,rgb(42_13_34/0.72),rgb(10_5_14/0.82))] p-7 shadow-[0_24px_60px_-30px_rgb(255_111_154/0.4)] sm:p-9">
            <div aria-hidden className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(closest-side,rgb(233_196_106/0.18),transparent)]" />
            {photo ? (
              <div className="group/photo relative -mx-7 -mt-7 mb-7 aspect-[4/3] overflow-hidden sm:-mx-9 sm:-mt-9">
                {/* eslint-disable-next-line @next/next/no-img-element -- site statique, sans optimiseur d'images */}
                <img
                  src={photo.src}
                  alt={`${reine.prenom}, ${memory.titre.toLowerCase()}`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-[1.6s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/photo:scale-105"
                  style={{ objectPosition: photo.cadrage }}
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[rgb(20_7_20)] via-transparent to-or/10" />
                <span aria-hidden className="shine" />
              </div>
            ) : null}
            <div className={`flex items-center gap-4 ${left ? "md:flex-row-reverse" : ""}`}>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-or/30 bg-or/[0.06] text-or-clair shadow-[0_0_24px_-4px_rgb(233_196_106/0.6)]">
                <MemoryIcon name={memory.icone} className="h-6 w-6" />
              </span>
              <p className="font-display text-[0.72rem] uppercase tracking-[0.28em] text-rose-pale sm:text-[0.78rem]">{memory.moment}</p>
            </div>
            <h3 className="mt-5 font-serif text-[clamp(1.9rem,7.2vw,2.6rem)] font-semibold leading-tight text-gold">{memory.titre}</h3>
            <p className="mt-3 font-serif text-[clamp(1.28rem,5vw,1.5rem)] font-medium leading-relaxed text-champagne/95">{memory.texte}</p>
          </div>
        </Tilt>
      </motion.article>
    </li>
  );
}
