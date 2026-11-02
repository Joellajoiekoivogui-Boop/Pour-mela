"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CircleCheck, CircleX, RotateCcw, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import type { QuizQuestion } from "@/types/content";
import { Flag } from "@/components/ui/Flag";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useProgress } from "@/components/progress/ProgressProvider";
import { PASS_RATIO } from "@/data/quizzes";
import { XP } from "@/lib/progress/levels";
import { cx } from "@/lib/utils/colors";

interface Props {
  /** Identifiant enregistré dans la progression (null = pas d'enregistrement). */
  quizSlug: string | null;
  title: string;
  questions: QuizQuestion[];
  onFinish?: (score: number, total: number) => void;
  /** Liens proposés à la fin. */
  next?: { href: string; label: string }[];
}

export function QuizPlayer({ quizSlug, title, questions, onFinish, next }: Props) {
  const { dispatch, state } = useProgress();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [previousBest] = useState(() => (quizSlug ? (state.quizResults[quizSlug]?.best ?? 0) : 0));

  const q = questions[index];
  const total = questions.length;
  const answered = picked !== null;
  const correct = answered && picked === q.answer;

  const choose = (i: number) => {
    if (answered) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };

  const goNext = () => {
    if (index + 1 < total) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    setDone(true);
    if (quizSlug) dispatch({ type: "recordQuiz", slug: quizSlug, score, total });
    onFinish?.(score, total);
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  const gainedXp = useMemo(() => Math.max(0, score - previousBest) * XP.correctAnswer, [score, previousBest]);

  if (!total) return <p className="rounded-2xl bg-white p-6 text-encre-doux">Ce quiz n&apos;a pas encore de questions.</p>;

  if (done) {
    const passed = score / total >= PASS_RATIO;
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white p-8 text-center shadow-carte ring-1 ring-encre/5" role="status">
        <Trophy className={cx("mx-auto size-14", passed ? "text-jaune-400" : "text-encre/20")} aria-hidden />
        <h2 className="mt-3 text-3xl font-black">
          {score} / {total}
        </h2>
        <p className="mt-2 text-lg text-encre-doux">
          {passed ? "Bravo ! Tu as bien compris. 🎉" : "Pas mal ! Relis le texte et réessaie : chaque erreur t'apprend quelque chose."}
        </p>
        {quizSlug && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 font-extrabold text-violet-700">
            <Sparkles className="size-4" aria-hidden /> {gainedXp > 0 ? `+${gainedXp} XP` : "Score déjà atteint : pas de nouveaux XP, mais tu t'entraînes !"}
          </p>
        )}
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button onClick={restart} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 font-extrabold ring-2 ring-encre/10 hover:bg-encre/5">
            <RotateCcw className="size-4" aria-hidden /> Recommencer
          </button>
          {next?.map((n) => (
            <Link key={n.href} href={n.href} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-orange-500 px-5 py-3 font-extrabold text-white hover:bg-orange-600">
              {n.label}
            </Link>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-carte ring-1 ring-encre/5 sm:p-8" aria-labelledby="question">
      <div className="mb-6 flex items-center gap-4">
        <p className="shrink-0 text-sm font-extrabold text-encre-doux">
          {title} · Question {index + 1}/{total}
        </p>
        <ProgressBar value={index / total} label="Progression du quiz" color="bg-violet-500" />
      </div>
      {q.flag && <Flag code={q.flag} className="mx-auto mb-6 h-28 w-44" title="Drapeau à reconnaître" />}
      <h2 id="question" className="text-2xl font-black">
        {q.question}
      </h2>
      <ul className="mt-6 grid gap-3">
        {q.options.map((opt, i) => {
          const isAnswer = i === q.answer;
          const isPicked = i === picked;
          return (
            <li key={opt}>
              <button
                onClick={() => choose(i)}
                disabled={answered}
                className={cx(
                  "flex min-h-14 w-full items-center gap-3 rounded-2xl px-5 py-3 text-left text-lg font-bold ring-2 transition",
                  !answered && "ring-encre/10 hover:bg-orange-50 hover:ring-orange-300",
                  answered && isAnswer && "bg-vert-50 text-vert-700 ring-vert-400",
                  answered && isPicked && !isAnswer && "bg-orange-50 text-orange-700 ring-orange-400",
                  answered && !isAnswer && !isPicked && "opacity-60 ring-encre/5",
                )}
                aria-pressed={isPicked}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-encre/5 text-sm font-black">{String.fromCharCode(65 + i)}</span>
                <span className="flex-1">{opt}</span>
                {answered && isAnswer && <CircleCheck className="size-6" aria-label="Bonne réponse" />}
                {answered && isPicked && !isAnswer && <CircleX className="size-6" aria-label="Ta réponse" />}
              </button>
            </li>
          );
        })}
      </ul>
      {answered && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cx("mt-6 rounded-2xl p-5", correct ? "bg-vert-50" : "bg-jaune-50")} role="status" aria-live="polite">
          <p className="font-black">{correct ? "Bonne réponse !" : "Presque ! Voici l'explication :"}</p>
          <p className="mt-1">{q.explanation}</p>
          <button onClick={goNext} className="mt-4 min-h-12 rounded-2xl bg-orange-500 px-6 py-3 font-extrabold text-white hover:bg-orange-600" autoFocus>
            {index + 1 < total ? "Question suivante" : "Voir mon score"}
          </button>
        </motion.div>
      )}
    </section>
  );
}
