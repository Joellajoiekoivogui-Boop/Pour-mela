"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CHAPITRES, joel, type Photo } from "@/config/joel";
import { audio } from "@/lib/audio";
import { ChapterLabel } from "../ui/ChapterLabel";
import { SplitText } from "../ui/SplitText";

const ease = [0.22, 1, 0.36, 1] as const;
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const photoUrl = (src: string) => (/^(https?:)?\/\//.test(src) ? src : `${base}/${src.replace(/^\//, "")}`);

function Tile({ photo, index, onOpen }: { photo: Photo; index: number; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <motion.figure
      className="mb-4 break-inside-avoid sm:mb-6"
      initial={{ opacity: 0, y: 60, filter: "blur(12px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1.1, delay: (index % 3) * 0.12, ease }}
    >
      <button
        ref={ref}
        type="button"
        onClick={onOpen}
        aria-label={`Agrandir : ${photo.alt}`}
        className="gallery-tile group relative block w-full overflow-hidden rounded-3xl"
        style={{ aspectRatio: `${photo.largeur} / ${photo.hauteur}` }}
      >
        <span className="gallery-zoom absolute inset-0 block">
          <motion.img
            layoutId={`photo-${index}`}
            src={photoUrl(photo.src)}
            alt={photo.alt}
            loading="lazy"
            decoding="async"
            style={{ y, scale: 1.18 }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </span>
        <span
          aria-hidden
          className="absolute inset-0 scale-100 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 transition duration-700 group-hover:opacity-90"
        />
        {photo.legende && (
          <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 p-5 text-left text-base font-medium text-white opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:opacity-100">
            {photo.legende}
          </figcaption>
        )}
      </button>
    </motion.figure>
  );
}

/** La visionneuse : fond noir, photo au centre, précédente / suivante, glisser du doigt. */
export function Lightbox({
  photos,
  index,
  onClose,
  onMove,
  prefix = "photo",
}: {
  photos: Photo[];
  index: number | null;
  onClose: () => void;
  onMove: (delta: number) => void;
  prefix?: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (index === null) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.dataset.locked = "";
    const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    lenis?.stop();
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight") onMove(1);
      else if (event.key === "ArrowLeft") onMove(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      delete document.body.dataset.locked;
      lenis?.start();
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [index, onClose, onMove]);

  const photo = index === null ? null : photos[index];
  return (
    <AnimatePresence>
      {photo && index !== null && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={photo.alt}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl sm:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.img
            key={index}
            layoutId={`${prefix}-${index}`}
            src={photoUrl(photo.src)}
            alt={photo.alt}
            className="max-h-[78svh] max-w-full rounded-2xl object-contain shadow-[0_40px_120px_rgba(139,92,246,0.35)]"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) onMove(1);
              else if (info.offset.x > 80) onMove(-1);
            }}
            onClick={(event) => event.stopPropagation()}
            transition={{ duration: 0.6, ease }}
          />
          {photo.legende && (
            <motion.p
              className="label absolute bottom-[calc(var(--safe-bottom)+28px)] left-0 right-0 text-center text-white/75"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {photo.legende} · {index + 1}/{photos.length}
            </motion.p>
          )}
          <button
            ref={closeRef}
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="lightbox-btn absolute right-4 top-[calc(var(--safe-top)+16px)] sm:right-8"
          >
            <X size={20} />
          </button>
          {photos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Photo précédente"
                onClick={(e) => (e.stopPropagation(), onMove(-1))}
                className="lightbox-btn absolute left-3 top-1/2 -translate-y-1/2 sm:left-8"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                aria-label="Photo suivante"
                onClick={(e) => (e.stopPropagation(), onMove(1))}
                className="lightbox-btn absolute right-3 top-1/2 -translate-y-1/2 sm:right-8"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Chapitre 06 (1/2) — la galerie, organisée comme une exposition. */
export function Gallery() {
  const c = CHAPITRES[5];
  const photos = joel.galerie.photos;
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const move = useCallback(
    (delta: number) => {
      setOpen((i) => (i === null ? i : (i + delta + photos.length) % photos.length));
      audio.chime(undefined, 0.4);
    },
    [photos.length],
  );

  return (
    <section id="souvenirs" data-chapter="souvenirs" className="section relative px-4 py-32 sm:px-10 md:py-44">
      <div className="mx-auto max-w-6xl">
        <div className="px-2">
          <ChapterLabel numero={c.numero} texte={c.sousTitre} />
          <SplitText as="h2" text={joel.galerie.titre} reveal="spread" className="title-xl mt-6" />
          <motion.p
            className="mt-5 max-w-xl text-lg text-white/60"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            {joel.galerie.sousTitre}
          </motion.p>
        </div>
        <div className="mt-14 columns-2 gap-4 sm:gap-6 md:columns-3">
          {photos.map((photo, i) => (
            <Tile key={photo.src + i} photo={photo} index={i} onOpen={() => (setOpen(i), audio.chime(i, 0.4))} />
          ))}
        </div>
      </div>
      <Lightbox photos={photos} index={open} onClose={close} onMove={move} />
    </section>
  );
}
