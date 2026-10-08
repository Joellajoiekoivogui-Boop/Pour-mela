"use client";

import { motion, type Variants } from "motion/react";
import { Fragment, useMemo, type CSSProperties } from "react";
import { useDirector } from "@/hooks/useDirector";
import { HeartGlyph } from "./HeartGlyph";

export type SplitEffect = "blur" | "rise" | "glow" | "drop";

const EASE = [0.22, 1, 0.36, 1] as const;

function graphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("fr", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

const HEART = /^❤️?$/;

// Sur les appareils modestes, le flou (coûteux) est retiré des lettres.
function omitFilter(target: Record<string, unknown>) {
  const copy = { ...target };
  delete copy.filter;
  return copy;
}

function withoutBlur(variants: Variants): Variants {
  return Object.fromEntries(
    Object.entries(variants).map(([key, value]) => [
      key,
      typeof value === "function"
        ? (i: number) => omitFilter((value as (i: number) => Record<string, unknown>)(i))
        : omitFilter(value as Record<string, unknown>),
    ]),
  ) as Variants;
}

function variantsFor(effect: SplitEffect, stagger: number, duration: number, delay: number): Variants {
  const show = (i: number) => ({ delay: delay + i * stagger, duration, ease: EASE });
  const gone = (i: number) => ({ delay: i * stagger * 0.22, duration: duration * 0.7, ease: EASE });
  switch (effect) {
    case "rise":
      return {
        hidden: { opacity: 0, y: "0.7em", rotateX: -85, filter: "blur(6px)" },
        visible: (i: number) => ({ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)", transition: show(i) }),
        gone: (i: number) => ({ opacity: 0, y: "-0.5em", filter: "blur(8px)", transition: gone(i) }),
      };
    case "glow":
      return {
        hidden: { opacity: 0, scale: 1.6, filter: "blur(14px)" },
        visible: (i: number) => ({ opacity: 1, scale: 1, filter: "blur(0px)", transition: show(i) }),
        gone: (i: number) => ({ opacity: 0, scale: 0.8, filter: "blur(10px)", transition: gone(i) }),
      };
    case "drop":
      return {
        hidden: { opacity: 0, y: "-0.6em", rotateZ: -8 },
        visible: (i: number) => ({ opacity: 1, y: 0, rotateZ: 0, transition: show(i) }),
        gone: (i: number) => ({ opacity: 0, y: "0.4em", transition: gone(i) }),
      };
    default:
      return {
        hidden: { opacity: 0, y: "0.3em", filter: "blur(12px)" },
        visible: (i: number) => ({ opacity: 1, y: 0, filter: "blur(0px)", transition: show(i) }),
        gone: (i: number) => ({ opacity: 0, y: "-0.9em", filter: "blur(10px)", transition: gone(i) }),
      };
  }
}

interface SplitTextProps {
  text: string;
  /** "hidden" → "visible" → "gone" (dissolution). */
  state: "hidden" | "visible" | "gone";
  by?: "letter" | "word";
  effect?: SplitEffect;
  delay?: number;
  stagger?: number;
  duration?: number;
  as?: "p" | "span" | "h1" | "h2" | "h3" | "div";
  className?: string;
  charClassName?: string;
  id?: string;
}

/**
 * Texte révélé lettre par lettre (ou mot par mot). Le texte complet reste
 * lisible par les lecteurs d'écran ; les lettres animées leur sont cachées.
 */
export function SplitText({
  text,
  state,
  by = "letter",
  effect = "blur",
  delay = 0,
  stagger = 0.035,
  duration = 0.9,
  as: Tag = "p",
  className = "",
  charClassName = "",
  id,
}: SplitTextProps) {
  const words = useMemo(() => text.split(/\s+/).filter(Boolean).map(graphemes), [text]);
  const light = useDirector((d) => d.ready && d.quality.tier === "low");
  const variants = useMemo(() => {
    const base = variantsFor(effect, stagger, duration, delay);
    return light ? withoutBlur(base) : base;
  }, [effect, stagger, duration, delay, light]);

  let index = 0;
  return (
    <Tag id={id} className={className}>
      <span className="sr-only">{text.replace(/❤️?/g, "♥")}</span>
      <motion.span
        aria-hidden
        initial="hidden"
        animate={state}
        style={{ perspective: effect === "rise" ? 600 : undefined, display: "inline" }}
      >
        {words.map((letters, w) => {
          if (by === "word") {
            const i = index++;
            const word = letters.join("");
            return (
              <Fragment key={w}>
                <span className="split-word">
                  <motion.span
                    className={`split-char ${charClassName}`}
                    custom={i}
                    variants={variants}
                    style={{ "--ci": i } as CSSProperties}
                  >
                    {HEART.test(word) ? <HeartGlyph /> : word}
                  </motion.span>
                </span>
                {w < words.length - 1 ? " " : null}
              </Fragment>
            );
          }
          return (
            <Fragment key={w}>
              <span className="split-word">
                {letters.map((char, c) => {
                  const i = index++;
                  return (
                    <motion.span
                      key={c}
                      className={`split-char ${charClassName}`}
                      custom={i}
                      variants={variants}
                      style={{ "--ci": i } as CSSProperties}
                    >
                      {HEART.test(char) ? <HeartGlyph /> : char}
                    </motion.span>
                  );
                })}
              </span>
              {w < words.length - 1 ? " " : null}
            </Fragment>
          );
        })}
      </motion.span>
    </Tag>
  );
}
