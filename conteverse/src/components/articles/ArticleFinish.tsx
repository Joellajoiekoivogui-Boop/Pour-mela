"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";
import type { QuizQuestion } from "@/types/content";
import { useProgress } from "@/components/progress/ProgressProvider";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";

/** Fin de lecture : l'enfant valide sa lecture puis répond au quiz de compréhension. */
export function ArticleFinish({ slug, title, quiz }: { slug: string; title: string; quiz: QuizQuestion[] }) {
  const { state, dispatch } = useProgress();
  const alreadyRead = !!state.articlesRead[slug];
  const [showQuiz, setShowQuiz] = useState(false);

  const finish = () => {
    dispatch({ type: "readArticle", slug });
    setShowQuiz(true);
  };

  if (showQuiz || alreadyRead) {
    return (
      <div className="grid gap-4" id="quiz">
        {alreadyRead && !showQuiz && (
          <p className="flex items-center gap-2 rounded-2xl bg-vert-50 p-4 font-bold text-vert-700">
            <CircleCheck className="size-5" aria-hidden /> Tu as déjà lu cet article. Teste-toi avec le quiz !
          </p>
        )}
        <QuizPlayer
          quizSlug={`article-${slug}`}
          title="Quiz de compréhension"
          questions={quiz}
          next={[
            { href: "/bibliotheque", label: "Autres lectures" },
            { href: "/assistant", label: "Poser une question à LUMO" },
          ]}
        />
      </div>
    );
  }
  return (
    <div className="rounded-3xl bg-orange-50 p-6 text-center" id="quiz">
      <p className="text-lg font-black">Tu as terminé « {title} » ?</p>
      <p className="mt-1 text-encre-doux">Valide ta lecture (+20 XP), puis réponds à {quiz.length} questions pour vérifier ce que tu as compris.</p>
      <button onClick={finish} className="mt-4 min-h-12 rounded-2xl bg-orange-500 px-6 py-3 font-extrabold text-white shadow-[0_4px_0_0_var(--color-orange-700)] hover:bg-orange-600">
        J&apos;ai fini de lire, je passe au quiz
      </button>
    </div>
  );
}
