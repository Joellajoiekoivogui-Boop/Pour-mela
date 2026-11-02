"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, CircleAlert, Send, ShieldCheck } from "lucide-react";
import { LumoMascot } from "@/components/ui/Avatar";
import { useProgress } from "@/components/progress/ProgressProvider";
import { cx } from "@/lib/utils/colors";

interface Message {
  role: "user" | "assistant";
  content: string;
  suggestions?: { slug: string; title: string }[];
  mode?: "demo" | "ai" | "safety";
  uncertain?: boolean;
}

const EXAMPLES = [
  "Pourquoi la Guinée s'appelle-t-elle Guinée ?",
  "Qui était Soundiata Keïta ?",
  "Qu'est-ce que le Fouta-Djalon ?",
  "Combien de pays compte l'Afrique ?",
  "Comment fonctionne un ordinateur ?",
  "Que veut dire épopée ?",
];

const MAX = 400;

export function LumoChat({ initialQuestion }: { initialQuestion?: string }) {
  const { state } = useProgress();
  const [chosenLevel, setLevel] = useState<"7-9" | "10-12" | null>(null);
  const level = chosenLevel ?? state.profile?.ageGroup ?? "7-9";
  const [mode, setMode] = useState<"demo" | "ai" | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Bonjour ! Je suis LUMO, ton compagnon de lecture. Pose-moi une question sur la Guinée, l'Afrique, les sciences ou un mot difficile. Et rappelle-toi : ne me donne jamais ton nom complet, ton adresse ou ton numéro de téléphone." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const askedInitial = useRef(false);

  useEffect(() => {
    fetch("/api/lumo")
      .then((r) => r.json())
      .then((d) => setMode(d.mode))
      .catch(() => setMode("demo"));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || loading) return;
    setError(null);
    const history = messages.slice(1).map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/lumo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q, level, history }) });
      const data = await res.json();
      if (!data?.text) throw new Error("réponse vide");
      setMessages((m) => [...m, { role: "assistant", content: data.text, suggestions: data.suggestions, mode: data.mode, uncertain: data.uncertain }]);
    } catch {
      setError("LUMO n'arrive pas à répondre pour le moment (connexion ?). Réessaie dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuestion && !askedInitial.current) {
      askedInitial.current = true;
      void ask(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <section className="flex min-h-[560px] flex-col overflow-hidden rounded-[2rem] bg-white shadow-carte ring-1 ring-encre/5" aria-label="Discussion avec LUMO">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-encre/5 bg-violet-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <LumoMascot size={40} talking={loading} />
            <div>
              <p className="font-black">LUMO</p>
              <p className="text-xs font-bold text-violet-700">
                {mode === "ai" ? "Connecté à l'IA · s'appuie sur les contenus CONTEVERSE" : mode === "demo" ? "Mode démonstration · réponses vérifiées prédéfinies" : "…"}
              </p>
            </div>
          </div>
          <div className="flex rounded-xl bg-white p-1 ring-1 ring-encre/10" role="radiogroup" aria-label="Niveau des réponses">
            {(["7-9", "10-12"] as const).map((l) => (
              <button key={l} role="radio" aria-checked={level === l} onClick={() => setLevel(l)} className={cx("rounded-lg px-3 py-1.5 text-sm font-extrabold", level === l ? "bg-violet-500 text-white" : "text-encre-doux")}>
                {l} ans
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} className={cx("flex gap-3", m.role === "user" && "justify-end")}>
              {m.role === "assistant" && <LumoMascot size={36} className="mt-1 shrink-0" />}
              <div className={cx("max-w-[85%] rounded-3xl px-5 py-3", m.role === "user" ? "rounded-br-md bg-orange-500 text-white" : m.mode === "safety" ? "rounded-bl-md bg-jaune-50" : "rounded-bl-md bg-encre/5")}>
                <p className="whitespace-pre-line text-[1.05rem] leading-relaxed">{m.content}</p>
                {m.uncertain && (
                  <p className="mt-2 flex items-center gap-1 text-xs font-bold text-jaune-600">
                    <CircleAlert className="size-3" aria-hidden /> Réponse non vérifiée par CONTEVERSE : vérifie avec un adulte ou un livre.
                  </p>
                )}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="mt-3 grid gap-1">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-encre-doux">Pour aller plus loin</p>
                    {m.suggestions.map((s) => (
                      <Link key={s.slug} href={`/bibliotheque/${s.slug}`} className="inline-flex items-center gap-2 text-sm font-extrabold text-violet-700 hover:underline">
                        <BookOpen className="size-4" aria-hidden /> {s.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-3" role="status">
              <LumoMascot size={36} talking />
              <span className="flex gap-1 rounded-3xl bg-encre/5 px-5 py-4" aria-label="LUMO réfléchit">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="size-2 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: `${d * 150}ms` }} />
                ))}
              </span>
            </div>
          )}
          {error && <p className="rounded-2xl bg-orange-50 p-3 text-sm font-bold text-orange-700" role="alert">{error}</p>}
          <div ref={endRef} />
        </div>

        <form
          className="border-t border-encre/5 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(input);
          }}
        >
          <div className="flex gap-2">
            <label className="flex-1">
              <span className="sr-only">Ta question pour LUMO</span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX))}
                placeholder="Écris ta question…"
                className="min-h-12 w-full rounded-2xl bg-creme px-4 text-lg font-semibold ring-1 ring-encre/10 placeholder:text-encre/40"
                maxLength={MAX}
              />
            </label>
            <button type="submit" disabled={!input.trim() || loading} className="grid size-12 place-items-center rounded-2xl bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-40" aria-label="Envoyer">
              <Send className="size-5" />
            </button>
          </div>
          <p className="mt-1 text-right text-xs text-encre-doux">{input.length}/{MAX}</p>
        </form>
      </section>

      <aside className="grid content-start gap-4">
        <div className="rounded-3xl bg-white p-5 shadow-carte ring-1 ring-encre/5">
          <h2 className="font-black">Idées de questions</h2>
          <ul className="mt-3 grid gap-2">
            {EXAMPLES.map((q) => (
              <li key={q}>
                <button onClick={() => void ask(q)} disabled={loading} className="w-full rounded-2xl bg-violet-50 px-4 py-3 text-left text-sm font-bold text-violet-700 hover:bg-violet-100 disabled:opacity-50">
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl bg-vert-50 p-5 text-sm text-vert-700">
          <h2 className="flex items-center gap-2 font-black">
            <ShieldCheck className="size-5" aria-hidden /> LUMO est protégé
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Il ne demande jamais d&apos;informations personnelles.</li>
            <li>Il refuse les sujets inadaptés aux enfants.</li>
            <li>Il dit quand il n&apos;est pas sûr, plutôt que d&apos;inventer.</li>
            <li>CONTEVERSE n&apos;enregistre pas tes conversations.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
