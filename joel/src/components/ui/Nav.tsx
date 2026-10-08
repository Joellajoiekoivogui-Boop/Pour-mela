"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CHAPITRES, joel } from "@/config/joel";
import { audio } from "@/lib/audio";
import { burst, findSecret, toast } from "@/lib/fx";
import { stage } from "@/lib/stage";
import { SoundToggle } from "./SoundToggle";

const ease = [0.22, 1, 0.36, 1] as const;

export function scrollToChapter(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const lenis = (window as unknown as { __lenis?: { scrollTo: (t: HTMLElement, o?: object) => void } }).__lenis;
  if (lenis) lenis.scrollTo(el, { duration: 1.6 });
  else el.scrollIntoView({ behavior: stage.quality.reducedMotion ? "auto" : "smooth" });
}

/**
 * Navigation très discrète : « JOËL » à gauche, « MENU » à droite, qui
 * ouvre une navigation plein écran. Cinq clics rapides sur le logo
 * déclenchent un secret.
 */
export function Nav() {
  const [open, setOpen] = useState(false);
  const [spin, setSpin] = useState(0);
  const clicks = useRef<number[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.dataset.locked = "";
    const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    lenis?.stop();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    menuRef.current?.querySelector<HTMLElement>("a")?.focus();
    const button = buttonRef.current;
    return () => {
      delete document.body.dataset.locked;
      lenis?.start();
      window.removeEventListener("keydown", onKey);
      button?.focus();
    };
  }, [open]);

  const onLogo = (event: React.MouseEvent) => {
    const now = performance.now();
    clicks.current = [...clicks.current.filter((t) => now - t < 1800), now];
    if (clicks.current.length >= 5) {
      clicks.current = [];
      setSpin((s) => s + 1);
      const rect = event.currentTarget.getBoundingClientRect();
      burst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, count: 120, power: 9 });
      audio.fanfare();
      const n = findSecret("logo");
      toast(`${joel.secrets.logo} · ${n}/4`, "secret");
    } else {
      audio.chime(clicks.current.length + 2, 0.6);
      if (clicks.current.length === 1) scrollToChapter("accueil");
    }
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 pt-[calc(var(--safe-top)+18px)] sm:px-10">
        <motion.button
          type="button"
          onClick={onLogo}
          aria-label={`${joel.prenom} — revenir à l'accueil`}
          className="logo relative font-display text-lg font-bold tracking-[0.3em] text-white"
          animate={{ rotateY: spin * 360, scale: spin ? [1, 1.4, 1] : 1 }}
          transition={{ duration: 1.2, ease }}
        >
          JOËL
          <span className="absolute -right-3 top-0 h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_12px_#a78bfa]" />
        </motion.button>
        <div className="flex items-center gap-3">
          <SoundToggle />
          <button
            ref={buttonRef}
            type="button"
            onClick={() => {
              setOpen((o) => !o);
              audio.whoosh(0.8);
            }}
            aria-expanded={open}
            aria-controls="menu"
            className="menu-button label group flex h-11 items-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 text-white backdrop-blur-md transition hover:border-violet-300/60 hover:bg-white/10"
          >
            <span className="relative block h-3 w-5" aria-hidden>
              <span className={`absolute left-0 top-0 h-px w-5 bg-white transition duration-500 ${open ? "translate-y-1.5 rotate-45" : ""}`} />
              <span
                className={`absolute bottom-0 left-0 h-px bg-white transition-all duration-500 ${open ? "w-5 -translate-y-1.5 -rotate-45" : "w-3 group-hover:w-5"}`}
              />
            </span>
            {open ? "Fermer" : "Menu"}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu"
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="fixed inset-0 z-40 flex flex-col justify-center overflow-y-auto bg-[#05050a]/90 px-6 pb-10 pt-28 backdrop-blur-2xl sm:px-16"
            initial={{ clipPath: "circle(0% at calc(100% - 60px) 40px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 60px) 40px)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 60px) 40px)" }}
            transition={{ duration: 0.8, ease }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_80%_20%,rgba(139,92,246,0.25),transparent)]" />
            <nav aria-label="Chapitres">
              <ol className="relative flex flex-col gap-1 sm:gap-2">
                {CHAPITRES.map((c, i) => (
                  <motion.li
                    key={c.id}
                    initial={{ opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.05, duration: 0.7, ease }}
                  >
                    <a
                      href={`#${c.id}`}
                      onClick={(event) => {
                        event.preventDefault();
                        setOpen(false);
                        window.setTimeout(() => scrollToChapter(c.id), 350);
                      }}
                      onMouseEnter={() => audio.chime(i, 0.35)}
                      className="menu-link group flex items-baseline gap-4 py-1 sm:gap-8"
                    >
                      <span className="label w-8 text-violet-300/80">{c.numero}</span>
                      <span className="menu-link-text font-display text-[clamp(1.45rem,6.4vw,5.2rem)] whitespace-nowrap font-bold uppercase leading-none tracking-tight">
                        <span className="menu-link-inner" data-text={c.nom}>
                          {c.nom}
                        </span>
                      </span>
                    </a>
                  </motion.li>
                ))}
              </ol>
            </nav>
            <motion.p className="label relative mt-10 text-white/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
              10.10 · Une nouvelle ère
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
