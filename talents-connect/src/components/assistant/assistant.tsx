"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, Info, Send, Sparkles, Target, User } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/misc";
import { MODE_LABELS, type AssistantMode } from "@/lib/ai/prompts";
import { cn } from "@/lib/utils";

interface Turn { role: "user" | "assistant"; content: string; source?: "ai" | "fallback"; notice?: string; plan?: { title: string; steps: string[]; advice?: string } }

const EXAMPLES: Record<AssistantMode, string[]> = {
  orientation: ["J'hésite entre l'informatique et la gestion, comment choisir ?", "Je suis en terminale et j'aime la biologie : quels métiers ?"],
  career: ["Aide-moi à structurer mon CV pour un stage en développement web", "Comment préparer un entretien pour une bourse ?", "Quelle structure pour une lettre de motivation ?"],
  path: ["Devenir développeur Full Stack", "Lancer une entreprise de transformation agricole", "Débuter en cybersécurité"],
  mentor_prep: ["Prépare une première séance avec un étudiant qui veut devenir data analyst", "Comment aider mon mentoré à fixer des objectifs réalistes ?"],
};

/** Mise en forme minimale et sûre (gras **…**, listes) sans HTML injecté. */
function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-1.5">
      {text.split("\n").map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) => (p.startsWith("**") && p.endsWith("**") ? <strong key={j}>{p.slice(2, -2)}</strong> : p));
        return line.trim() === "" ? <div key={i} className="h-1" /> : <p key={i}>{parts}</p>;
      })}
    </div>
  );
}

export function Assistant({ modes, initialMode, aiEnabled, goalsHref }: { modes: AssistantMode[]; initialMode: AssistantMode; aiEnabled: boolean; goalsHref?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<AssistantMode>(initialMode);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();

  const send = (text: string) => {
    const content = text.trim();
    if (!content) return;
    const history: Turn[] = mode === "path" ? [{ role: "user", content }] : [...turns, { role: "user", content }];
    setTurns(mode === "path" ? [...turns, { role: "user", content }] : history);
    setInput("");
    start(async () => {
      try {
        const res = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode, messages: history.map(({ role, content: c }) => ({ role, content: c.slice(0, 4000) })) }) });
        const data = (await res.json()) as { text?: string; source?: "ai" | "fallback"; notice?: string; plan?: Turn["plan"]; error?: string };
        if (!res.ok || !data.text) throw new Error(data.error ?? "Réponse invalide");
        setTurns((t) => [...t, { role: "assistant", content: data.text!, source: data.source, notice: data.notice, plan: data.plan }]);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "L'assistant est indisponible.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {!aiEnabled && <Alert tone="warning" title="Mode sans IA">Aucune clé d&apos;API n&apos;est configurée : l&apos;assistant répond avec des modèles prédéfinis (clairement signalés). Voir le README pour activer l&apos;IA.</Alert>}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Mode de l'assistant">
        {modes.map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => { setMode(m); setTurns([]); }}
            className={cn("rounded-full px-3.5 py-1.5 text-sm transition-colors", mode === m ? "bg-navy text-white" : "bg-subtle text-slate-700 hover:bg-slate-200")}>
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4">
          {turns.length === 0 && (
            <div className="py-4 text-center">
              <span className="mx-auto inline-flex size-11 items-center justify-center rounded-full bg-violet-soft text-violet"><Sparkles className="size-5" /></span>
              <p className="mt-3 font-medium text-navy">{mode === "path" ? "Décrivez un objectif : l'assistant propose un parcours en étapes." : "Posez votre question."}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {EXAMPLES[mode].map((e) => <button key={e} type="button" onClick={() => send(e)} className="rounded-full border border-border px-3 py-1.5 text-[13px] text-slate-700 hover:bg-subtle">{e}</button>)}
              </div>
            </div>
          )}
          {turns.map((t, i) => (
            <div key={i} className={cn("flex gap-3", t.role === "user" && "flex-row-reverse")}>
              <span className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-full", t.role === "user" ? "bg-primary-soft text-primary" : "bg-violet-soft text-violet")}>
                {t.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
              </span>
              <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed", t.role === "user" ? "bg-primary text-white" : "bg-subtle text-slate-800")}>
                {t.role === "assistant" && <Badge tone={t.source === "ai" ? "violet" : "warning"} className="mb-2">{t.source === "ai" ? "Réponse IA — à vérifier" : "Modèle prédéfini (sans IA)"}</Badge>}
                <RichText text={t.content} />
                {t.plan && (
                  <div className="mt-3 rounded-lg bg-white p-3">
                    <p className="font-semibold text-navy">{t.plan.title}</p>
                    <ol className="mt-2 list-decimal space-y-1 pl-5">{t.plan.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                    {goalsHref && (
                      <Button size="sm" className="mt-3" onClick={() => router.push(`${goalsHref}?plan=${encodeURIComponent(JSON.stringify({ title: t.plan!.title, steps: t.plan!.steps }))}`)}>
                        <Target /> En faire un objectif
                      </Button>
                    )}
                  </div>
                )}
                {t.notice && <p className="mt-2 flex items-start gap-1.5 text-xs text-muted"><Info className="mt-0.5 size-3 shrink-0" aria-hidden />{t.notice}</p>}
              </div>
            </div>
          ))}
          {pending && <p className="text-sm text-muted" aria-live="polite">L&apos;assistant réfléchit…</p>}
          <form className="flex items-end gap-2 border-t border-border pt-4" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === "path" ? "Ex. : devenir développeur Full Stack" : "Votre question…"} className="min-h-10 resize-none" rows={2} maxLength={4000} aria-label="Message à l'assistant"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} />
            <Button type="submit" size="icon" loading={pending} disabled={!input.trim()} aria-label="Envoyer">{!pending && <Send />}</Button>
          </form>
          <p className="text-[11px] text-muted">L&apos;assistant peut se tromper et n&apos;invente pas d&apos;offres : vérifiez les informations et parlez-en avec votre mentor. Ne saisissez pas de données sensibles.</p>
        </CardContent>
      </Card>
    </div>
  );
}
