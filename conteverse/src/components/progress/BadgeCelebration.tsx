"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PartyPopper, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { badgeById } from "@/lib/progress/badges";
import { useProgress } from "./ProgressProvider";
import { BadgeMedal } from "./BadgeMedal";

/** Fenêtre de célébration lorsqu'un badge est gagné. */
export function BadgeCelebration() {
  const { celebrations, dismissCelebration } = useProgress();
  const id = celebrations[0];
  const badge = id ? badgeById[id] : null;

  useEffect(() => {
    if (!badge) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismissCelebration();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [badge, dismissCelebration]);

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          key={badge.id}
          className="fixed inset-0 z-50 grid place-items-center bg-encre/50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="badge-title"
        >
          <motion.div
            className="relative w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl"
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <button onClick={dismissCelebration} className="absolute right-3 top-3 rounded-full p-2 hover:bg-encre/5" aria-label="Fermer">
              <X className="size-5" />
            </button>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-jaune-50 px-4 py-1 text-sm font-extrabold text-jaune-600">
              <PartyPopper className="size-4" aria-hidden /> Nouveau badge !
            </p>
            <motion.div initial={{ rotate: -20, scale: 0.5 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.15, type: "spring" }} className="mx-auto w-fit">
              <BadgeMedal badge={badge} earned size="lg" />
            </motion.div>
            <h2 id="badge-title" className="mt-4 text-2xl font-black">
              {badge.name}
            </h2>
            <p className="mt-2 text-encre-doux">{badge.description}</p>
            <div className="mt-6 flex flex-col gap-2">
              <button onClick={dismissCelebration} className="min-h-12 rounded-2xl bg-orange-500 px-5 py-3 font-extrabold text-white hover:bg-orange-600">
                Continuer
              </button>
              <Link href="/passeport" onClick={dismissCelebration} className="min-h-12 rounded-2xl px-5 py-3 font-bold text-violet-600 hover:bg-violet-50">
                Voir mon passeport
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
