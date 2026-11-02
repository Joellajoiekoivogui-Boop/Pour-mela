"use client";

import Link from "next/link";
import { useState } from "react";
import { Clock, Download, RotateCcw, ShieldCheck } from "lucide-react";
import { useProgress } from "@/components/progress/ProgressProvider";
import { categories } from "@/data/categories";
import { articleBySlug } from "@/data/articles";
import { quizBySlug } from "@/data/quizzes";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function ParentsView() {
  const { state, summary, ready, dispatch, userId } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  if (!ready) return <div className="h-96 animate-pulse rounded-[2rem] bg-white" aria-busy="true" />;

  // 7 derniers jours de lecture
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { key, label: d.toLocaleDateString("fr-FR", { weekday: "short" }), min: Math.round((state.readingSeconds[key] ?? 0) / 60) };
  });
  const maxMin = Math.max(10, ...days.map((d) => d.min));

  const themes = categories
    .map((c) => ({ c, n: Object.keys(state.articlesRead).filter((s) => articleBySlug[s]?.category === c.slug).length }))
    .filter((t) => t.n > 0);

  const quizzes = Object.entries(state.quizResults).sort((a, b) => b[1].lastAt.localeCompare(a[1].lastAt));

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "conteverse-progression.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl bg-bleu-50 p-4 text-sm text-bleu-700">
        {userId
          ? "Compte connecté : la progression est synchronisée avec votre compte CONTEVERSE."
          : isSupabaseConfigured
            ? "Ces données concernent cet appareil. Créez un compte responsable pour suivre la progression sur plusieurs appareils."
            : "Mode démonstration : ces données sont enregistrées uniquement sur cet appareil (aucun serveur)."}
        {!userId && isSupabaseConfigured && (
          <Link href="/connexion" className="ml-1 font-extrabold underline">
            Créer un compte
          </Link>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Temps de lecture total", `${summary.readingMinutes} min`],
          ["Articles lus", summary.articles],
          ["Quiz réussis", summary.quizzesPassed],
          ["Niveau", `${summary.level.current.rank} · ${summary.level.current.name}`],
        ].map(([l, v]) => (
          <div key={l as string} className="rounded-3xl bg-white p-5 shadow-carte ring-1 ring-encre/5">
            <dt className="text-sm font-bold text-encre-doux">{l}</dt>
            <dd className="mt-1 text-2xl font-black">{v}</dd>
          </div>
        ))}
      </dl>

      <section className="rounded-3xl bg-white p-6 shadow-carte ring-1 ring-encre/5">
        <h2 className="flex items-center gap-2 text-xl font-black">
          <Clock className="size-5 text-orange-600" aria-hidden /> Temps de lecture (7 derniers jours)
        </h2>
        <div className="mt-6 flex h-40 items-end gap-3" role="img" aria-label={days.map((d) => `${d.label} : ${d.min} minutes`).join(", ")}>
          {days.map((d) => (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-bold tabular-nums text-encre-doux">{d.min}</span>
              <div className="w-full rounded-t-xl bg-orange-400" style={{ height: `${Math.max(4, (d.min / maxMin) * 120)}px` }} />
              <span className="text-xs font-bold capitalize">{d.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-encre-doux">Seul le temps passé sur une page de lecture visible est compté. Au-delà de 30 minutes par jour, CONTEVERSE suggère une pause à l&apos;enfant.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-6 shadow-carte ring-1 ring-encre/5">
          <h2 className="text-xl font-black">Thèmes explorés</h2>
          {themes.length ? (
            <ul className="mt-4 grid gap-3">
              {themes.map(({ c, n }) => (
                <li key={c.slug}>
                  <div className="flex justify-between text-sm font-bold">
                    <span>{c.name}</span>
                    <span>{n}</span>
                  </div>
                  <ProgressBar value={n / Math.max(...themes.map((t) => t.n))} label={c.name} color="bg-violet-500" className="mt-1 h-2" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-encre-doux">Aucun article lu pour l&apos;instant.</p>
          )}
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-carte ring-1 ring-encre/5">
          <h2 className="text-xl font-black">Résultats aux quiz</h2>
          {quizzes.length ? (
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="text-encre-doux">
                  <th className="pb-2">Quiz</th>
                  <th className="pb-2 text-right">Meilleur</th>
                  <th className="pb-2 text-right">Essais</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map(([slug, r]) => (
                  <tr key={slug} className="border-t border-encre/5">
                    <td className="py-2 font-bold">{quizBySlug[slug]?.title.replace(/^Quiz : /, "") ?? slug}</td>
                    <td className="py-2 text-right tabular-nums">
                      {r.best}/{r.total}
                    </td>
                    <td className="py-2 text-right tabular-nums">{r.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-3 text-encre-doux">Aucun quiz joué pour l&apos;instant.</p>
          )}
        </section>
      </div>

      <section className="rounded-3xl bg-vert-50 p-6 text-vert-700">
        <h2 className="flex items-center gap-2 text-xl font-black">
          <ShieldCheck className="size-5" aria-hidden /> Données de l&apos;enfant
        </h2>
        <p className="mt-2 text-sm">
          CONTEVERSE ne collecte ni nom complet, ni date de naissance, ni photo, ni localisation de l&apos;enfant : seulement un pseudonyme, un avatar, une tranche d&apos;âge et sa progression. Aucune publicité, aucune revente.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={exportData} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white px-4 py-2 font-extrabold ring-1 ring-vert-400">
            <Download className="size-4" aria-hidden /> Exporter les données
          </button>
          {confirmReset ? (
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-bold">Effacer toute la progression ?</span>
              <button onClick={() => { dispatch({ type: "reset" }); setConfirmReset(false); }} className="min-h-11 rounded-2xl bg-orange-500 px-4 py-2 font-extrabold text-white">
                Oui, effacer
              </button>
              <button onClick={() => setConfirmReset(false)} className="min-h-11 rounded-2xl px-4 py-2 font-extrabold">
                Annuler
              </button>
            </span>
          ) : (
            <button onClick={() => setConfirmReset(true)} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white px-4 py-2 font-extrabold ring-1 ring-orange-300 text-orange-700">
              <RotateCcw className="size-4" aria-hidden /> Réinitialiser la progression
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
