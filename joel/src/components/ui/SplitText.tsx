"use client";

import { motion, type Variants } from "motion/react";

// Les emoji gardent leurs couleurs : pas de dégradé sur eux.
const EMOJI = /\p{Extended_Pictographic}/u;

const TAGS = { span: motion.span, p: motion.p, h1: motion.h1, h2: motion.h2, h3: motion.h3, div: motion.div };

export type Reveal = "rise" | "blur" | "scale" | "flip" | "spread";

const LETTER: Record<Reveal, Variants> = {
  rise: { hidden: { y: "110%", opacity: 0 }, show: { y: "0%", opacity: 1 } },
  blur: { hidden: { opacity: 0, filter: "blur(14px)", y: 12 }, show: { opacity: 1, filter: "blur(0px)", y: 0 } },
  scale: { hidden: { opacity: 0, scale: 2.2, filter: "blur(8px)" }, show: { opacity: 1, scale: 1, filter: "blur(0px)" } },
  flip: { hidden: { opacity: 0, rotateX: -90, y: 20 }, show: { opacity: 1, rotateX: 0, y: 0 } },
  spread: { hidden: { opacity: 0, letterSpacing: "0.6em", filter: "blur(10px)" }, show: { opacity: 1, letterSpacing: "0em", filter: "blur(0px)" } },
};

interface Props {
  text: string;
  as?: keyof typeof TAGS;
  className?: string;
  reveal?: Reveal;
  /** Découpe en lettres ou en mots. */
  by?: "letter" | "word";
  delay?: number;
  stagger?: number;
  /** Rejouer à chaque passage, ou une seule fois. */
  once?: boolean;
  /** Animation déclenchée par le parent (variants « hidden » / « show »). */
  controlled?: boolean;
  /** Classe de chaque lettre (ou mot) : un dégradé doit être posé ici, pas sur le titre. */
  charClass?: string;
}

/**
 * Texte qui apparaît lettre par lettre (ou mot par mot). Le texte complet
 * reste lisible par les lecteurs d'écran (aria-label).
 */
export function SplitText({
  text,
  as = "span",
  className,
  reveal = "rise",
  by = "letter",
  delay = 0,
  stagger,
  once = true,
  controlled,
  charClass = "",
}: Props) {
  const Tag = TAGS[as];
  const words = text.split(" ");
  const step = stagger ?? (by === "letter" ? 0.035 : 0.08);
  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: step, delayChildren: delay } } };
  const trigger = controlled ? {} : { initial: "hidden", whileInView: "show", viewport: { once, amount: 0.5 } };

  return (
    <Tag className={className} aria-label={text} variants={container} {...trigger}>
      {words.map((word, w) => (
        <span key={w} aria-hidden className="inline-block whitespace-nowrap" style={{ perspective: reveal === "flip" ? 600 : undefined }}>
          {by === "word" ? (
            <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
              <motion.span className={`inline-block ${charClass}`} variants={LETTER[reveal]} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
                {word}
              </motion.span>
            </span>
          ) : (
            Array.from(word).map((char, c) => (
              <span key={c} className={reveal === "rise" ? "inline-block overflow-hidden pb-[0.08em] align-bottom" : "inline-block"}>
                <motion.span
                  className={`inline-block ${EMOJI.test(char) ? "" : charClass}`}
                  variants={LETTER[reveal]}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                >
                  {char}
                </motion.span>
              </span>
            ))
          )}
          {w < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
