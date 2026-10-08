"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { CHAPITRES, joel } from "@/config/joel";
import { useCountdown } from "@/hooks/useCountdown";
import { celebrate } from "@/lib/fx";
import { ChapterLabel } from "../ui/ChapterLabel";
import { Magnetic } from "../ui/Magnetic";
import { SplitText } from "../ui/SplitText";

const ease = [0.22, 1, 0.36, 1] as const;

/** Un chiffre qui glisse quand il change. */
function Digit({ value }: { value: string }) {
  return (
    <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden align-top">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          className="absolute inset-0 text-center"
          initial={{ y: "-100%", opacity: 0, filter: "blur(6px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "100%", opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.55, ease }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Tile({ value, label, pad = 2, index }: { value: number; label: string; pad?: number; index: number }) {
  const text = String(value).padStart(pad, "0");
  return (
    <motion.div
      className="tile glass group relative flex flex-col items-center justify-center rounded-3xl px-3 py-6 sm:px-6 sm:py-10"
      initial={{ opacity: 0, y: 40, rotateX: -30 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 1, delay: index * 0.1, ease }}
      data-cursor
    >
      <span
        className={`font-mono-ui whitespace-nowrap font-semibold leading-none tabular-nums text-white ${pad > 2 ? "text-[clamp(2rem,6.5vw,5rem)]" : "text-[clamp(2.6rem,9vw,7rem)]"}`}
        aria-hidden
      >
        {Array.from(text).map((d, i) => (
          <Digit key={`${text.length}-${i}`} value={d} />
        ))}
      </span>
      <span className="label mt-3 text-violet-200/70">{label}</span>
      <span aria-hidden className="tile-shine" />
    </motion.div>
  );
}

/** Chapitre 02 — le compte à rebours (et le jour J). */
export function Countdown() {
  const c = CHAPITRES[1];
  const t = joel.compteARebours;
  const cd = useCountdown();
  const previous = useRef<string | null>(null);

  // Minuit pile : le compte à rebours atteint zéro sous nos yeux.
  // Le jour J, en arrivant sur le site : la fête après l'ouverture.
  useEffect(() => {
    if (!cd.ready) return;
    const before = previous.current;
    previous.current = cd.phase;
    if (cd.phase !== "today") return;
    if (before === "before" || before === "after") celebrate(true);
    else if (before === null) {
      const timer = window.setTimeout(() => celebrate(true), 5600);
      return () => window.clearTimeout(timer);
    }
  }, [cd.ready, cd.phase]);

  const today = cd.phase === "today";
  const status = today ? t.jourJ : cd.phase === "after" ? t.apres : t.avant;
  const { days, hours, minutes, seconds } = cd.parts;
  const spoken = `${days} jours, ${hours} heures, ${minutes} minutes`;

  return (
    <section
      id="compte-a-rebours"
      data-chapter="compte-a-rebours"
      className="section relative flex min-h-[100svh] flex-col items-center justify-center px-5 text-center"
    >
      <ChapterLabel numero={c.numero} texte={c.sousTitre} className="justify-center" />
      <SplitText as="h2" text={t.titre} reveal="blur" className="title-xl mt-6 max-w-5xl" />

      <AnimatePresence mode="wait">
        <motion.p
          key={status}
          className={`mt-6 text-[clamp(1.2rem,3vw,2rem)] ${today ? "text-gradient font-display font-extrabold uppercase" : "font-light text-white/75"}`}
          initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: cd.ready ? 1 : 0, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.8 }}
        >
          {status}
        </motion.p>
      </AnimatePresence>

      {today ? (
        <motion.div
          className="mt-10 flex flex-col items-center gap-8"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease }}
        >
          <p className="today-title font-display text-[clamp(2.4rem,9vw,8rem)] font-extrabold uppercase leading-[0.9]">
            {joel.message.titre.split(/(\p{Extended_Pictographic})/u).map((part, i) =>
              i % 2 ? (
                <span key={i} className="emoji">
                  {part}
                </span>
              ) : (
                part
              ),
            )}
          </p>
          <Magnetic>
            <button type="button" className="btn-glow" onClick={() => celebrate(true)}>
              {joel.final.bouton}
            </button>
          </Magnetic>
        </motion.div>
      ) : (
        <>
          {cd.phase === "after" && <p className="label mt-10 text-white/50">{t.prochain}</p>}
          <div
            role="timer"
            aria-label={cd.ready ? spoken : undefined}
            className="mt-8 grid w-full max-w-5xl grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4"
            style={{ perspective: 1000 }}
          >
            <Tile index={0} value={days} pad={days > 99 ? 3 : 2} label="Jours" />
            <Tile index={1} value={hours} label="Heures" />
            <Tile index={2} value={minutes} label="Minutes" />
            <Tile index={3} value={seconds} label="Secondes" />
          </div>
        </>
      )}

      {cd.ready && <YearBar next={cd.next} remaining={cd.remaining} />}
    </section>
  );
}

/** L'année de Joël, d'un anniversaire au suivant, en pourcentage. */
function YearBar({ next, remaining }: { next: Date; remaining: number }) {
  const last = new Date(next.getFullYear() - 1, next.getMonth(), next.getDate());
  const now = next.getTime() - remaining;
  const ratio = Math.min(1, Math.max(0, (now - last.getTime()) / (next.getTime() - last.getTime())));
  return (
    <div className="mt-14 w-full max-w-md">
      <div className="label flex justify-between text-white/45">
        <span>10.10.{String(last.getFullYear()).slice(2)}</span>
        <span>{(ratio * 100).toFixed(1)} %</span>
        <span>10.10.{String(next.getFullYear()).slice(2)}</span>
      </div>
      <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full origin-left rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-300 to-white shadow-[0_0_14px_#a78bfa]"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: ratio }}
          viewport={{ once: true }}
          transition={{ duration: 2.2, ease }}
        />
      </div>
    </div>
  );
}
