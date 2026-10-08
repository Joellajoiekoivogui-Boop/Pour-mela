"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { reine } from "@/config/reine";
import { useDirector } from "@/hooks/useDirector";
import { useSceneOnView } from "@/hooks/useSceneOnView";
import { enableTilt, tiltActive, tiltNeedsPermission, vibrate } from "@/lib/device";
import { director, type SparkKind } from "@/lib/director";
import { music } from "@/lib/music";
import { ChapterLabel } from "../ui/Ornament";
import { SplitText } from "../ui/SplitText";

// Les étoiles dessinent une couronne (coordonnées en % du cadre), dans
// l'ordre du contour : base gauche, cinq pointes, base droite.
const STARS = [
  [12, 80], [9, 36], [25, 57], [32, 25], [42, 51], [50, 12],
  [58, 51], [68, 25], [75, 57], [91, 36], [88, 80],
] as const;
const JEWELS = [[30, 70], [50, 70], [70, 70]] as const;

/**
 * Chapitre IV — son royaume : une constellation à allumer étoile par étoile
 * (chacune joue une note), puis un espace libre où la lumière suit le doigt.
 */
export function Kingdom() {
  const { royaume } = reine;
  const section = useRef<HTMLElement>(null);
  const header = useRef<HTMLDivElement>(null);
  const headerInView = useInView(header, { once: true, margin: "-25% 0px" });
  const glActive = useDirector((d) => d.glActive);

  useSceneOnView(section, "play");

  return (
    <section id="royaume" ref={section} aria-labelledby="titre-royaume" className="relative px-5 py-[18svh]">
      <div ref={header} className="mx-auto mb-12 flex max-w-3xl flex-col items-center gap-6 text-center">
        <ChapterLabel>{royaume.chapitre}</ChapterLabel>
        <SplitText
          as="h2"
          id="titre-royaume"
          text={royaume.titre}
          state={headerInView ? "visible" : "hidden"}
          effect="rise"
          stagger={0.045}
          className="font-display text-[clamp(1.5rem,6.5vw,3rem)] leading-tight text-gold"
        />
        <p className="max-w-md font-serif text-[clamp(1.1rem,4.4vw,1.35rem)] italic text-champagne/75">{royaume.consigne}</p>
      </div>

      <Constellation />

      {/* Le pad dessine avec les particules : il n'a de sens qu'avec WebGL. */}
      {glActive ? (
        <>
          <p className="mx-auto mt-16 max-w-md text-center font-serif text-[clamp(1.1rem,4.4vw,1.35rem)] italic text-champagne/75">
            {royaume.libre}
          </p>
          <LightPad />
          <TiltToggle />
        </>
      ) : null}
    </section>
  );
}

function Constellation() {
  const [lit, setLit] = useState<boolean[]>(() => STARS.map(() => false));
  const [complete, setComplete] = useState(false);
  const board = useRef<HTMLDivElement>(null);
  const count = lit.filter(Boolean).length;

  const light = (index: number, element: HTMLElement) => {
    if (lit[index]) return;
    const rect = element.getBoundingClientRect();
    director.emit({ kind: "stars", x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    music.note(count);
    vibrate(10);
    setLit((list) => list.map((value, i) => (i === index ? true : value)));
  };

  // La dernière étoile allumée : la couronne s'embrase.
  useEffect(() => {
    if (count < STARS.length || complete) return;
    const timer = window.setTimeout(() => {
      setComplete(true);
      const rect = board.current?.getBoundingClientRect();
      if (rect) {
        director.emit({ kind: "firework", x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.45, amount: 1.2 });
        director.emit({ kind: "hearts", x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.6 });
      }
      director.pulse(1);
      music.bloom(1.2);
      vibrate([20, 40, 20, 40, 60]);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [count, complete]);

  const reset = () => {
    setComplete(false);
    setLit(STARS.map(() => false));
  };

  const outline = STARS.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <div className="mx-auto w-[min(88vw,520px)]">
      <div ref={board} className="relative aspect-square" data-no-burst>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id="couronne-or" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff4dc" />
              <stop offset="0.5" stopColor="#e9c46a" />
              <stop offset="1" stopColor="#b8862f" />
            </linearGradient>
            <radialGradient id="couronne-halo">
              <stop offset="0" stopColor="rgb(233 196 106 / 0.35)" />
              <stop offset="1" stopColor="rgb(233 196 106 / 0)" />
            </radialGradient>
          </defs>
          <motion.circle
            cx="50"
            cy="50"
            r="48"
            fill="url(#couronne-halo)"
            initial={{ opacity: 0 }}
            animate={{ opacity: complete ? 1 : count / STARS.length / 3 }}
            transition={{ duration: 1.2 }}
          />
          <motion.polygon
            points={outline}
            fill="url(#couronne-or)"
            initial={{ opacity: 0 }}
            animate={{ opacity: complete ? 0.22 : 0 }}
            transition={{ duration: 1.6 }}
          />
          {STARS.map(([x, y], i) => {
            const [nx, ny] = STARS[(i + 1) % STARS.length];
            const on = lit[i] && lit[(i + 1) % STARS.length];
            return (
              <motion.line
                key={i}
                x1={x}
                y1={y}
                x2={nx}
                y2={ny}
                stroke="#f6e3b4"
                strokeWidth="0.5"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={on ? { pathLength: 1, opacity: 0.9 } : { pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{ filter: "drop-shadow(0 0 1.5px #e9c46a)" }}
              />
            );
          })}
          {JEWELS.map(([x, y], i) => (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r="2.2"
              fill={i === 1 ? "#ff6f9a" : "#b8a4ff"}
              initial={{ scale: 0, opacity: 0 }}
              animate={complete ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ delay: 0.6 + i * 0.15, type: "spring", stiffness: 200, damping: 12 }}
              style={{ transformOrigin: `${x}px ${y}px`, filter: "drop-shadow(0 0 2px currentColor)" }}
            />
          ))}
        </svg>

        {STARS.map(([x, y], i) => (
          <button
            key={i}
            type="button"
            aria-label={`Étoile ${i + 1}${lit[i] ? ", allumée" : ""}`}
            aria-pressed={lit[i]}
            onClick={(event) => light(i, event.currentTarget)}
            className="absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <motion.span
              aria-hidden
              className="block rounded-full bg-or-clair"
              animate={
                lit[i]
                  ? { width: 14, height: 14, opacity: 1, boxShadow: "0 0 18px 6px rgba(246,227,180,0.85), 0 0 46px 14px rgba(255,111,154,0.35)" }
                  : { width: 7, height: 7, opacity: [0.35, 0.8, 0.35], boxShadow: "0 0 8px 2px rgba(246,227,180,0.35)" }
              }
              transition={lit[i] ? { type: "spring", stiffness: 260, damping: 14 } : { duration: 2.2, repeat: Infinity, delay: i * 0.17 }}
            />
          </button>
        ))}
      </div>

      <div className="mt-6 flex min-h-24 flex-col items-center gap-4 text-center" aria-live="polite">
        <AnimatePresence mode="wait">
          {complete ? (
            <motion.div key="fin" className="flex flex-col items-center gap-4" exit={{ opacity: 0 }}>
              <SplitText
                text={reine.royaume.jeuTermine}
                state="visible"
                effect="glow"
                delay={0.5}
                stagger={0.04}
                className="font-script text-[clamp(2rem,8.5vw,3.2rem)] leading-tight text-gold glow-gold"
              />
              <motion.button
                type="button"
                onClick={reset}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.4 }}
                className="font-display text-[0.6rem] uppercase tracking-[0.35em] text-champagne/50 underline-offset-8 hover:text-or-clair hover:underline"
              >
                Rallumer les étoiles
              </motion.button>
            </motion.div>
          ) : (
            <motion.p key="compte" className="font-display text-xs uppercase tracking-[0.35em] text-or/70" exit={{ opacity: 0 }}>
              {count} / {STARS.length}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const BRUSHES: { kind: SparkKind; label: string; symbol: string }[] = [
  { kind: "hearts", label: "Cœurs", symbol: "♥" },
  { kind: "stars", label: "Étoiles", symbol: "✦" },
  { kind: "gold", label: "Or", symbol: "◆" },
];

const numberFormat = new Intl.NumberFormat("fr-FR");

/** Un espace où dessiner avec la lumière (le défilement y est suspendu). */
function LightPad() {
  const [brush, setBrush] = useState<SparkKind>("hearts");
  const [touched, setTouched] = useState(false);
  const [sparks, setSparks] = useState(0);
  const drawing = useRef(false);
  const press = useRef<{ x: number; y: number; timer: number; last: number }>({ x: 0, y: 0, timer: 0, last: 0 });

  useEffect(() => {
    const timer = window.setInterval(() => setSparks(director.stats.sparks), 150);
    return () => window.clearInterval(timer);
  }, []);

  const down = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("button")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    setTouched(true);
    director.emit({ kind: brush, x: event.clientX, y: event.clientY });
    music.twinkle(1);
    vibrate(8);
    window.clearTimeout(press.current.timer);
    press.current = {
      x: event.clientX,
      y: event.clientY,
      last: performance.now(),
      // Un appui long : une supernova.
      timer: window.setTimeout(() => {
        director.emit({ kind: "firework", x: press.current.x, y: press.current.y, amount: 1.3 });
        director.pulse(1);
        music.bloom(0.9);
        vibrate([20, 30, 50]);
      }, 650),
    };
  };

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!drawing.current) return;
    const p = director.pointer;
    director.emit({ kind: "trail", x: event.clientX, y: event.clientY, vx: p.vx, vy: p.vy, amount: 1.4 });
    const now = performance.now();
    if (now - press.current.last > 110) {
      press.current.last = now;
      director.emit({ kind: brush === "hearts" ? "dust" : brush, x: event.clientX, y: event.clientY, amount: brush === "hearts" ? 1.5 : 0.35 });
      music.twinkle(0.5);
    }
    if (Math.hypot(event.clientX - press.current.x, event.clientY - press.current.y) > 14) window.clearTimeout(press.current.timer);
  };

  const up = () => {
    drawing.current = false;
    window.clearTimeout(press.current.timer);
  };

  return (
    <div
      data-pad
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      className="relative mx-auto mt-8 h-[58svh] max-h-[600px] min-h-[340px] w-full max-w-4xl touch-none select-none overflow-hidden rounded-[2rem] border border-or/20"
      style={{
        backgroundImage:
          "radial-gradient(rgb(246 227 180 / 0.12) 1px, transparent 1px), radial-gradient(circle at 50% 40%, rgb(42 13 34 / 0.45), rgb(5 2 8 / 0.35))",
        backgroundSize: "26px 26px, 100% 100%",
      }}
    >
      <div className="absolute inset-x-0 top-4 z-10 flex justify-center gap-2" role="radiogroup" aria-label="Pinceau de lumière">
        {BRUSHES.map((b) => (
          <button
            key={b.kind}
            type="button"
            role="radio"
            aria-checked={brush === b.kind}
            onClick={() => setBrush(b.kind)}
            className={`rounded-full border px-4 py-2 font-display text-[0.62rem] uppercase tracking-[0.22em] transition-all duration-300 ${
              brush === b.kind ? "border-or/70 bg-or/15 text-or-clair shadow-[0_0_20px_-4px_rgb(233_196_106/0.7)]" : "border-champagne/15 text-champagne/60"
            }`}
          >
            <span aria-hidden className="mr-1.5">
              {b.symbol}
            </span>
            {b.label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {!touched ? (
          <motion.div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(8px)" }}
          >
            <motion.span
              className="h-14 w-14 rounded-full border border-or-clair/60"
              animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <p className="font-serif text-lg italic text-champagne/60">Touche, glisse, maintiens…</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <p className="absolute inset-x-0 bottom-4 text-center font-display text-[0.6rem] uppercase tracking-[0.3em] text-or/70" aria-live="off">
        ✦ {numberFormat.format(sparks)} étincelles offertes
      </p>
    </div>
  );
}

/** Sur téléphone : faire bouger les étoiles en inclinant l'écran. */
function TiltToggle() {
  const [state, setState] = useState<"hidden" | "offer" | "on">("hidden");

  useEffect(() => {
    if (!director.quality.touch || director.quality.reducedMotion) return;
    const initial = tiltActive() ? "on" : tiltNeedsPermission() ? "offer" : "hidden";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dépend de l'appareil, connu seulement côté navigateur
    setState(initial);
  }, []);

  if (state === "hidden") return null;
  return (
    <p className="mt-6 text-center font-serif text-base italic text-champagne/60">
      {state === "on" ? (
        "Incline ton téléphone : le ciel te suit."
      ) : (
        <button
          type="button"
          className="underline decoration-or/40 underline-offset-4"
          onClick={async () => setState((await enableTilt()) ? "on" : "hidden")}
        >
          Faire bouger le ciel en inclinant le téléphone
        </button>
      )}
    </p>
  );
}
