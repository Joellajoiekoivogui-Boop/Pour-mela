"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { director } from "@/lib/director";
import { vibrate } from "@/lib/device";
import { music } from "@/lib/music";

interface RoyalButtonProps {
  children: ReactNode;
  onClick?: (center: { x: number; y: number }) => void;
  icon?: ReactNode;
  variant?: "royal" | "ghost";
  className?: string;
  pulse?: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

/**
 * Bouton magnétique : il se laisse attirer par la souris, ondule au toucher
 * et projette des étincelles au clic.
 */
export function RoyalButton({ children, onClick, icon, variant = "royal", className = "", pulse = false }: RoyalButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 16, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 200, damping: 16, mass: 0.6 });
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const onMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "mouse" || director.quality.reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * 0.28);
    y.set((event.clientY - (rect.top + rect.height / 2)) * 0.4);
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const onDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const id = performance.now();
    setRipples((list) => [...list.slice(-3), { id, x: event.clientX - rect.left, y: event.clientY - rect.top }]);
    window.setTimeout(() => setRipples((list) => list.filter((r) => r.id !== id)), 900);
    vibrate(12);
  };

  const onActivate = () => {
    const rect = ref.current?.getBoundingClientRect();
    const center = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: innerWidth / 2, y: innerHeight / 2 };
    director.emit({ kind: "stars", x: center.x, y: center.y });
    music.twinkle(1.2);
    onClick?.(center);
  };

  const look =
    variant === "royal"
      ? "royal-border px-8 py-4 text-[0.78rem] sm:text-sm text-or-clair shadow-[0_0_40px_-8px_rgb(233_196_106/0.55)]"
      : "border border-or/25 bg-white/[0.03] px-6 py-3 text-[0.7rem] sm:text-xs text-champagne/85 hover:border-or/60 hover:text-or-clair";

  return (
    <motion.button
      ref={ref}
      type="button"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerDown={onDown}
      onClick={onActivate}
      style={{ x: springX, y: springY }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      data-cursor
      className={`group relative isolate inline-flex select-none items-center justify-center gap-3 rounded-full font-display uppercase tracking-[0.28em] transition-colors duration-500 ${look} ${className}`}
    >
      {pulse ? (
        <>
          <span className="pulse-ring" aria-hidden />
          <span className="pulse-ring" aria-hidden />
        </>
      ) : null}
      <span className="shine" aria-hidden />
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full" aria-hidden>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            className="absolute h-8 w-8 rounded-full bg-or-clair/40"
            style={{ left: r.x - 16, top: r.y - 16 }}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 9, opacity: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </span>
      {icon ? <span className="relative transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:rotate-[-8deg]">{icon}</span> : null}
      <span className="relative">{children}</span>
    </motion.button>
  );
}
