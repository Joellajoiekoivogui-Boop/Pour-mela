"use client";

import { motion } from "motion/react";
import { useCallback, useState } from "react";
import { joel } from "@/config/joel";
import { audio } from "@/lib/audio";
import { SplitText } from "../ui/SplitText";
import { Lightbox, photoUrl } from "./Gallery";

const TILTS = [-4, 3, -2.5, 4.5, -3.5, 2];

/** Chapitre 06 (2/2) — quelques souvenirs, en cartes posées de travers. */
export function Memories() {
  const list = joel.souvenirs.liste;
  const photos = list.map((s) => ({ ...s.photo, legende: s.titre }));
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const move = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + list.length) % list.length)), [list.length]);

  return (
    <section data-chapter="souvenirs" className="section relative px-6 pb-32 sm:px-10 md:pb-44">
      <div className="mx-auto max-w-6xl">
        <SplitText as="h2" text={joel.souvenirs.titre} reveal="flip" className="title-lg text-center" />
        <div className="mt-16 grid gap-10 sm:grid-cols-2 md:gap-14 lg:grid-cols-4 lg:gap-8">
          {list.map((s, i) => (
            <motion.article
              key={s.titre}
              className="memory-card"
              initial={{ opacity: 0, y: 80, rotate: TILTS[i % TILTS.length] * 3 }}
              whileInView={{ opacity: 1, y: 0, rotate: TILTS[i % TILTS.length] }}
              whileHover={{ rotate: 0, y: -12, scale: 1.03 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ type: "spring", stiffness: 140, damping: 18, delay: i * 0.08 }}
            >
              <button
                type="button"
                onClick={() => (setOpen(i), audio.chime(i * 2, 0.4))}
                className="block w-full text-left"
                aria-label={`Ouvrir le souvenir : ${s.titre}`}
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-white/5">
                  <motion.img layoutId={`souvenir-${i}`} src={photoUrl(s.photo.src)} alt={s.photo.alt} loading="lazy" className="h-full w-full object-cover" />
                  <span className="label absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-white/85 backdrop-blur">{s.date}</span>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold leading-snug">{s.titre}</h3>
                <p className="mt-2 text-white/60">{s.texte}</p>
              </button>
            </motion.article>
          ))}
        </div>
      </div>
      <Lightbox photos={photos} index={open} onClose={close} onMove={move} prefix="souvenir" />
    </section>
  );
}
