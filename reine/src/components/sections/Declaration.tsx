"use client";

import { useInView, useMotionValueEvent, useScroll } from "motion/react";
import { useRef, type CSSProperties } from "react";
import { reine } from "@/config/reine";
import { useSceneOnView } from "@/hooks/useSceneOnView";
import { director } from "@/lib/director";
import { music } from "@/lib/music";
import { HeartGlyph } from "../ui/HeartGlyph";
import { ChapterLabel } from "../ui/Ornament";
import { SplitText } from "../ui/SplitText";

const STYLES: Record<string, string> = {
  texte: "font-serif text-[clamp(1.4rem,5.4vw,2.35rem)] font-light leading-[1.5] text-champagne",
  grand: "font-serif text-[clamp(2.1rem,8.6vw,4.6rem)] font-light italic leading-[1.12] text-or-clair",
  plume: "font-script text-[clamp(2.5rem,10.5vw,5.2rem)] leading-[1.15] text-or glow-gold",
};

/**
 * Chapitre II — la déclaration. Chaque phrase s'allume mot après mot au
 * rythme du défilement, pendant qu'une galaxie pivote lentement derrière.
 */
export function Declaration() {
  const { declaration } = reine;
  const section = useRef<HTMLElement>(null);
  const header = useRef<HTMLDivElement>(null);
  const headerInView = useInView(header, { once: true, margin: "-25% 0px" });
  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "end start"] });

  useSceneOnView(section, "galaxy");

  // La galaxie passe de la tranche à la vue de face pendant la lecture.
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    director.galaxyTilt = 1.35 - v * 1.05;
  });

  return (
    <section id="declaration" ref={section} aria-labelledby="titre-declaration" className="relative px-6 py-[20svh]">
      <div ref={header} className="mx-auto mb-[16svh] flex max-w-3xl flex-col items-center gap-6 text-center">
        <ChapterLabel>{declaration.chapitre}</ChapterLabel>
        <SplitText
          as="h2"
          id="titre-declaration"
          text={declaration.titre}
          state={headerInView ? "visible" : "hidden"}
          effect="rise"
          stagger={0.045}
          className="font-display text-[clamp(1.5rem,6.5vw,3rem)] leading-tight text-gold"
        />
      </div>

      <div className="mx-auto flex max-w-4xl flex-col gap-[18svh] text-center">
        {declaration.paragraphes.map((paragraph, i) => (
          <ScrollWords key={i} text={paragraph.texte} className={STYLES[paragraph.style] ?? STYLES.texte} sparkle={paragraph.style !== "texte"} />
        ))}
      </div>
    </section>
  );
}

/** Une phrase dont les mots s'allument au défilement (une seule variable CSS). */
function ScrollWords({ text, className, sparkle }: { text: string; className: string; sparkle: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const done = useRef(false);
  const words = text.split(/\s+/).filter(Boolean);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.88", "end 0.5"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const element = ref.current;
    if (!element) return;
    element.style.setProperty("--p", v.toFixed(3));
    if (sparkle && !done.current && v > 0.97) {
      done.current = true;
      const rect = element.getBoundingClientRect();
      director.emit({ kind: "gold", x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, amount: 2 });
      music.twinkle(0.8);
    }
  });

  return (
    <p ref={ref} className={`scroll-words ${className}`} style={{ "--n": words.length } as CSSProperties}>
      {words.map((word, i) => (
        <span key={i}>
          <span className="scroll-word" style={{ "--i": i } as CSSProperties}>
            {/^❤️?$/.test(word) ? <HeartGlyph /> : word}
          </span>{" "}
        </span>
      ))}
    </p>
  );
}
