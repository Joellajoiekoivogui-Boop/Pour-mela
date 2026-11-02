"use client";

import { useProgress } from "@/components/progress/ProgressProvider";

export function WelcomeLine() {
  const { state } = useProgress();
  return (
    <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-orange-700 shadow-carte">
      👋 {state.profile ? `Bon retour, ${state.profile.pseudo} !` : "Bienvenue sur CONTEVERSE !"} Prêt pour l&apos;aventure ?
    </p>
  );
}
