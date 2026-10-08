"use client";

import { motion } from "motion/react";

/** Petite étiquette « CHAPITRE 0X — … » au-dessus de chaque section. */
export function ChapterLabel({ numero, texte, className = "" }: { numero: string; texte: string; className?: string }) {
  return (
    <motion.p
      className={`label flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="whitespace-nowrap text-violet-300">Chapitre {numero}</span>
      <motion.span
        className="h-px w-10 origin-left bg-gradient-to-r from-violet-400 to-transparent"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.3 }}
      />
      <span className="whitespace-nowrap text-white/60">{texte}</span>
    </motion.p>
  );
}
