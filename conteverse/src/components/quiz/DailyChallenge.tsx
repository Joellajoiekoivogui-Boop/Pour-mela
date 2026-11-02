"use client";

import { useMemo, useState } from "react";
import { useIsClient } from "@/hooks/useIsClient";
import { CalendarCheck, Sparkles } from "lucide-react";
import { dailyQuestions } from "@/lib/progress/daily";
import { todayKey } from "@/lib/progress/engine";
import { useProgress } from "@/components/progress/ProgressProvider";
import { QuizPlayer } from "./QuizPlayer";
import type { QuizQuestion } from "@/types/content";

/** Défi du jour : 3 questions, une seule récompense par jour (pas de série à entretenir). */
export function DailyChallenge() {
  const { state, dispatch, ready } = useProgress();
  const isClient = useIsClient();
  const day = isClient ? todayKey() : null;
  const questions = useMemo<QuizQuestion[]>(() => (day ? dailyQuestions(day) : []), [day]);
  const [playing, setPlaying] = useState(false);

  if (!day || !ready) return <div className="h-40 animate-pulse rounded-3xl bg-jaune-50" aria-hidden />;
  const done = state.dailyDone[day] !== undefined;

  if (playing)
    return (
      <QuizPlayer
        quizSlug={null}
        title="Défi du jour"
        questions={questions}
        onFinish={(score) => dispatch({ type: "completeDaily", day, score })}
      />
    );

  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-jaune-400 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8" aria-labelledby="defi-jour">
      <div>
        <p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest">
          <CalendarCheck className="size-4" aria-hidden /> Défi du jour
        </p>
        <h2 id="defi-jour" className="mt-1 text-2xl font-black">
          3 questions surprises pour aujourd&apos;hui
        </h2>
        <p className="mt-1 font-semibold text-encre/80">
          {done ? `Défi relevé aujourd'hui (${state.dailyDone[day]}/3) ! Reviens demain pour de nouvelles questions.` : "+15 XP une fois par jour. Pas de série à entretenir : reviens quand tu veux !"}
        </p>
      </div>
      <button onClick={() => setPlaying(true)} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-encre px-6 py-3 font-extrabold text-white hover:bg-encre/90">
        <Sparkles className="size-4" aria-hidden /> {done ? "Rejouer pour le plaisir" : "Relever le défi"}
      </button>
    </section>
  );
}
