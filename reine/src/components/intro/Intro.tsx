"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { reine } from "@/config/reine";
import { useDirector } from "@/hooks/useDirector";
import { director } from "@/lib/director";
import { CrownIcon } from "../ui/Icons";
import { RoyalButton } from "../ui/RoyalButton";
import { SplitText } from "../ui/SplitText";

const STAGGER = 0.034;
const LETTER_DURATION = 0.9;
const HOLD = 1.9;

interface IntroProps {
  onEnter: (center: { x: number; y: number }) => void;
  leaving: boolean;
}

/**
 * L'écran d'introduction : des phrases mystérieuses s'écrivent puis se
 * dissolvent en poussière d'étoiles, et son prénom se forme dans le ciel.
 * Un toucher accélère.
 */
export function Intro({ onEnter, leaving }: IntroProps) {
  const phrases = reine.intro.phrases;
  const [step, setStep] = useState(0);
  const [phraseState, setPhraseState] = useState<"visible" | "gone">("visible");
  const dissolving = useRef(false);
  const [nameStage, setNameStage] = useState(0); // 1 prénom · 2 suite du nom · 3 bouton
  const anchor = useRef<HTMLDivElement>(null);
  const phraseRef = useRef<HTMLDivElement>(null);
  const lastSkip = useRef(0);
  const glActive = useDirector((d) => d.glActive);
  const onName = step >= phrases.length;

  // La phrase qui s'efface se dissout en poussière dorée.
  const dissolve = useCallback(() => {
    const letters = phraseRef.current?.querySelectorAll<HTMLElement>(".split-char");
    if (!letters) return;
    letters.forEach((letter, i) => {
      if (i % 2) return;
      const rect = letter.getBoundingClientRect();
      director.emit({ kind: "dust", x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, amount: 0.7 });
    });
  }, []);

  const advance = useCallback(() => {
    if (dissolving.current) return;
    dissolving.current = true;
    dissolve();
    setPhraseState("gone");
    window.setTimeout(() => {
      dissolving.current = false;
      setPhraseState("visible");
      setStep((s) => Math.min(s + 1, phrases.length));
    }, 1100);
  }, [dissolve, phrases.length]);

  // Le rythme des phrases.
  useEffect(() => {
    if (step >= phrases.length) return;
    if (step === 0) director.setScene("void");
    const writing = phrases[step].length * STAGGER + LETTER_DURATION;
    const timer = window.setTimeout(advance, (writing + HOLD + (step === 0 ? 1.2 : 0.6)) * 1000);
    return () => window.clearTimeout(timer);
  }, [step, phrases, advance]);

  useEffect(() => {
    if (step === 1) director.setScene("sky");
  }, [step]);

  // Le prénom se forme, puis la suite du nom, puis le bouton.
  useEffect(() => {
    if (!onName) return;
    const timers = [
      window.setTimeout(() => {
        director.setScene("name", anchor.current);
        setNameStage((s) => Math.max(s, 1));
      }, 700),
      window.setTimeout(() => {
        const rect = anchor.current?.getBoundingClientRect();
        if (rect) director.emit({ kind: "ring", x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        director.pulse(1);
      }, 2600),
      window.setTimeout(() => setNameStage((s) => Math.max(s, 2)), 3000),
      window.setTimeout(() => setNameStage(3), 5200),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [onName]);

  const skip = () => {
    const now = performance.now();
    if (now - lastSkip.current < 700) return;
    lastSkip.current = now;
    if (!onName) advance();
    else if (nameStage < 3) {
      // Le prénom doit être appelé avant que le bouton n'apparaisse.
      director.setScene("name", anchor.current);
      setNameStage(3);
    }
  };

  return (
    <motion.section
      aria-label="Introduction"
      className="fixed inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
      onPointerDown={skip}
      animate={leaving ? { opacity: 0, scale: 1.08, filter: "blur(12px)" } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 1.1, ease: [0.55, 0, 0.45, 1] }}
    >
      <h1 className="sr-only">
        Pour {reine.prenom} {reine.suiteDuNom}
      </h1>

      {/* Les phrases mystérieuses */}
      <div ref={phraseRef} className="absolute inset-x-6 top-1/2 -translate-y-1/2" aria-live="polite">
        {!onName ? (
          <SplitText
            key={step}
            text={phrases[step]}
            state={phraseState}
            delay={step === 0 ? 0.9 : 0.2}
            stagger={STAGGER}
            duration={LETTER_DURATION}
            className="mx-auto max-w-[22ch] font-serif text-[clamp(1.85rem,7.4vw,3.6rem)] font-light italic leading-[1.25] text-champagne glow-soft sm:max-w-[28ch]"
          />
        ) : null}
      </div>

      {/* Le prénom */}
      <div className="relative flex w-full flex-col items-center" style={{ marginTop: "-6svh" }}>
        <div ref={anchor} className="flex h-[30svh] w-full items-center justify-center" aria-hidden>
          {onName && !glActive ? (
            <SplitText
              text={reine.prenom}
              state={nameStage >= 1 ? "visible" : "hidden"}
              effect="glow"
              stagger={0.12}
              duration={1.4}
              as="span"
              className="font-script text-[clamp(5rem,26vw,12rem)] leading-none text-gold text-gold-live glow-gold"
            />
          ) : null}
        </div>

        <div className="min-h-[7.5rem]">
          {onName ? (
            <>
              <SplitText
                text={reine.suiteDuNom}
                state={nameStage >= 2 ? "visible" : "hidden"}
                effect="rise"
                stagger={0.07}
                duration={1.1}
                className="font-display text-[clamp(0.85rem,3.6vw,1.35rem)] uppercase tracking-royal text-gold"
              />
              <SplitText
                text={reine.intro.sousLePrenom}
                state={nameStage >= 2 ? "visible" : "hidden"}
                by="word"
                delay={1.1}
                stagger={0.18}
                duration={1.2}
                className="mt-5 font-serif text-[clamp(1.05rem,4.4vw,1.5rem)] italic text-champagne/80"
              />
            </>
          ) : null}
        </div>
      </div>

      {/* L'entrée */}
      <div className="absolute inset-x-0 bottom-[calc(var(--safe-bottom)+9svh)] flex flex-col items-center gap-5">
        <AnimatePresence>
          {nameStage >= 3 && !leaving ? (
            <motion.div
              key="entrer"
              className="flex flex-col items-center gap-5"
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.6, filter: "blur(12px)" }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <RoyalButton pulse onClick={onEnter} icon={<CrownIcon className="h-5 w-5 text-or float-slow" />}>
                {reine.intro.bouton}
              </RoyalButton>
              <p className="flex items-center gap-2 font-serif text-sm italic text-champagne/55">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                  <path d="M4 14v-2a8 8 0 0116 0v2" />
                  <rect x="3" y="14" width="4" height="6" rx="1.5" />
                  <rect x="17" y="14" width="4" height="6" rx="1.5" />
                </svg>
                {reine.intro.conseilSon}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
        {!onName ? (
          <motion.p
            className="font-display text-[0.6rem] uppercase tracking-[0.4em] text-champagne/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4, duration: 2 }}
          >
            Touche pour continuer
          </motion.p>
        ) : null}
      </div>
    </motion.section>
  );
}
