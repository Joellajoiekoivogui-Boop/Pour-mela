"use client";

import { motion } from "motion/react";

/** Filet doré qui se dessine de part et d'autre d'un petit losange. */
export function Ornament({ show = true, className = "" }: { show?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 240 16" aria-hidden className={`h-4 w-48 text-or ${className}`}>
      <motion.path
        d="M112 8H8"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={show ? { pathLength: 1, opacity: 0.8 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M128 8h104"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={show ? { pathLength: 1, opacity: 0.8 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M120 2l6 6-6 6-6-6z"
        fill="currentColor"
        initial={{ scale: 0, rotate: -90, opacity: 0 }}
        animate={show ? { scale: 1, rotate: 0, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: "120px 8px" }}
      />
    </svg>
  );
}

/** Petite étiquette de chapitre : « ✦ Chapitre II ✦ ». */
export function ChapterLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[0.62rem] uppercase tracking-royal text-or/80 sm:text-xs">
      <span className="mr-3 inline-block text-rose-pale/70">✦</span>
      {children}
      <span className="ml-3 inline-block text-rose-pale/70">✦</span>
    </p>
  );
}
