"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, BookmarkCheck, Square, Volume2 } from "lucide-react";
import { cx } from "@/lib/utils/colors";
import { useIsClient } from "@/hooks/useIsClient";

const SAVED_CACHE = "conteverse-lectures";

/** Écoute (synthèse vocale du navigateur, sans téléchargement) et enregistrement hors connexion. */
export function ArticleTools({ text, path }: { text: string; path: string }) {
  const isClient = useIsClient();
  const [speaking, setSpeaking] = useState(false);
  const [savedState, setSaved] = useState<"no" | "yes" | "busy">("no");
  const ttsAvailable = isClient && "speechSynthesis" in window;
  const saved = isClient && !("caches" in window) ? "unsupported" : savedState;
  const utter = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!("caches" in window)) return;
    caches
      .open(SAVED_CACHE)
      .then((c) => c.match(path))
      .then((hit) => setSaved(hit ? "yes" : "no"))
      .catch(() => setSaved("no"));
    return () => window.speechSynthesis?.cancel();
  }, [path]);

  const toggleSpeech = () => {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR";
    u.rate = 0.92;
    const fr = synth.getVoices().find((v) => v.lang.startsWith("fr"));
    if (fr) u.voice = fr;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utter.current = u;
    synth.speak(u);
    setSpeaking(true);
  };

  const toggleSave = async () => {
    if (saved === "unsupported" || saved === "busy") return;
    const cache = await caches.open(SAVED_CACHE);
    if (saved === "yes") {
      await cache.delete(path);
      setSaved("no");
      return;
    }
    setSaved("busy");
    try {
      await cache.add(path);
      setSaved("yes");
    } catch {
      setSaved("no");
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {ttsAvailable && (
        <button onClick={toggleSpeech} className={cx("inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 py-2 font-extrabold ring-2", speaking ? "bg-violet-500 text-white ring-violet-500" : "bg-white ring-encre/10 hover:ring-violet-300")} aria-pressed={speaking}>
          {speaking ? <Square className="size-4" aria-hidden /> : <Volume2 className="size-5" aria-hidden />}
          {speaking ? "Arrêter la lecture" : "Écouter l'article"}
        </button>
      )}
      {saved !== "unsupported" && (
        <button onClick={toggleSave} className={cx("inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 py-2 font-extrabold ring-2", saved === "yes" ? "bg-vert-50 text-vert-700 ring-vert-400" : "bg-white ring-encre/10 hover:ring-vert-400")} aria-pressed={saved === "yes"}>
          {saved === "yes" ? <BookmarkCheck className="size-5" aria-hidden /> : <Bookmark className="size-5" aria-hidden />}
          {saved === "yes" ? "Disponible hors connexion" : saved === "busy" ? "Enregistrement…" : "Lire hors connexion"}
        </button>
      )}
    </div>
  );
}
