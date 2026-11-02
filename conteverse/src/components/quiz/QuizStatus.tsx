"use client";

import { useProgress } from "@/components/progress/ProgressProvider";
import { PASS_RATIO } from "@/data/quizzes";

export function QuizStatus({ slug }: { slug: string }) {
  const { state } = useProgress();
  const r = state.quizResults[slug];
  if (!r) return <span className="text-sm font-bold text-encre-doux">Pas encore joué</span>;
  const ok = r.best / r.total >= PASS_RATIO;
  return (
    <span className={`text-sm font-extrabold ${ok ? "text-vert-600" : "text-orange-700"}`}>
      {ok ? "Réussi" : "À retenter"} · meilleur score {r.best}/{r.total}
    </span>
  );
}
