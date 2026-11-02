"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, RotateCcw, Square, Volume2 } from "lucide-react";
import type { Story } from "@/types/content";
import { Scene } from "@/components/ui/Scene";
import { useProgress } from "@/components/progress/ProgressProvider";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";
import { cx } from "@/lib/utils/colors";
import { useIsClient } from "@/hooks/useIsClient";

export function StoryPlayer({ story }: { story: Story }) {
  const { dispatch } = useProgress();
  const [path, setPath] = useState<string[]>([story.start]);
  const [speaking, setSpeaking] = useState(false);
  const tts = useIsClient() && typeof window !== "undefined" && "speechSynthesis" in window;
  const node = story.nodes[path[path.length - 1]];

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  useEffect(() => {
    if (node.ending) dispatch({ type: "completeStory", slug: story.slug, ending: node.id });
  }, [node, story.slug, dispatch]);

  const stopSpeech = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  const go = (next: string) => {
    stopSpeech();
    setPath((p) => [...p, next]);
    document.getElementById("recit")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const speak = () => {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(node.paragraphs.join(" "));
    u.lang = "fr-FR";
    u.rate = 0.9;
    u.onend = () => setSpeaking(false);
    synth.speak(u);
    setSpeaking(true);
  };

  return (
    <div id="recit" className="scroll-mt-20">
      <div className="overflow-hidden rounded-[2rem] bg-white shadow-carte ring-1 ring-encre/5">
        <AnimatePresence mode="wait">
          <motion.div key={node.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Scene name={node.scene ?? story.scene} className="aspect-[2/1] w-full" />
            <div className="lecture p-6 sm:p-10">
              <p className="mb-4 text-sm font-extrabold text-violet-600">
                Étape {path.length}
                {story.interactive && " · c'est toi qui choisis"}
              </p>
              <div className="grid gap-4">
                {node.paragraphs.map((p) => (
                  <p key={p.slice(0, 30)}>{p}</p>
                ))}
              </div>
              {tts && (
                <button onClick={speak} className={cx("mt-6 inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 py-2 font-extrabold ring-2", speaking ? "bg-violet-500 text-white ring-violet-500" : "ring-encre/10 hover:ring-violet-300")} aria-pressed={speaking}>
                  {speaking ? <Square className="size-4" aria-hidden /> : <Volume2 className="size-5" aria-hidden />} {speaking ? "Arrêter" : "Écouter ce passage"}
                </button>
              )}

              {node.choices && (
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {node.choices.map((c) => (
                    <button key={c.next + c.label} onClick={() => go(c.next)} className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-violet-50 px-5 py-4 text-left text-lg font-extrabold text-violet-700 ring-2 ring-violet-100 hover:bg-violet-100 hover:ring-violet-400">
                      {c.label} <ArrowRight className="size-5 shrink-0" aria-hidden />
                    </button>
                  ))}
                </div>
              )}

              {node.ending && (
                <div className="mt-8 rounded-3xl bg-jaune-50 p-6">
                  <p className="text-sm font-extrabold uppercase tracking-widest text-jaune-600">Fin de l&apos;histoire</p>
                  <h2 className="mt-1 text-2xl font-black">{node.ending.title}</h2>
                  <p className="mt-2">{node.ending.message}</p>
                  {story.interactive && (
                    <button onClick={() => {
                        stopSpeech();
                        setPath([story.start]);
                      }} className="mt-4 inline-flex items-center gap-2 font-extrabold text-violet-700 hover:underline">
                      <RotateCcw className="size-4" aria-hidden /> Recommencer et faire d&apos;autres choix
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {node.ending && (
        <div className="mt-8">
          <QuizPlayer quizSlug={`histoire-${story.slug}`} title="Quiz de l'histoire" questions={story.quiz} next={[{ href: "/histoires", label: "Autres histoires" }]} />
        </div>
      )}
    </div>
  );
}
