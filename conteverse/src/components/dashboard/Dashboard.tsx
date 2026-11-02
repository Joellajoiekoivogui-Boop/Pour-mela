"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, Gamepad2, Globe, Pencil, Sparkles, Trophy } from "lucide-react";
import { useProgress } from "@/components/progress/ProgressProvider";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Flag } from "@/components/ui/Flag";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { BadgeMedal } from "@/components/progress/BadgeMedal";
import { DailyChallenge } from "@/components/quiz/DailyChallenge";
import { BADGES } from "@/lib/progress/badges";
import { articleBySlug, articles } from "@/data/articles";
import { countries } from "@/data/countries";
import { challengeQuizzes } from "@/data/quizzes";
import { ProfileSetup } from "./ProfileSetup";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function Dashboard() {
  const { state, summary, ready, userId } = useProgress();
  const [editing, setEditing] = useState(false);

  if (!ready) return <div className="h-96 animate-pulse rounded-[2rem] bg-white" aria-busy="true" aria-label="Chargement de ton espace" />;
  if (!state.profile || editing) return <ProfileSetup initial={state.profile} onDone={() => setEditing(false)} />;

  const { level } = summary;
  const age = state.profile.ageGroup === "7-9" ? 8 : 11;
  const lastRead = Object.entries(state.articlesRead)
    .sort((a, b) => b[1].localeCompare(a[1]))
    .slice(0, 3)
    .map(([slug]) => articleBySlug[slug])
    .filter(Boolean);
  const recommended = articles.filter((a) => !state.articlesRead[a.slug] && age >= a.ageMin && age <= a.ageMax).sort((a, b) => (a.scope === "GN" ? -1 : 0) - (b.scope === "GN" ? -1 : 0)).slice(0, 3);
  const challenges = challengeQuizzes.filter((q) => !state.quizResults[q.slug]).slice(0, 3);
  const badgesEarned = BADGES.filter((b) => state.badges[b.id]);

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 rounded-[2rem] bg-linear-to-br from-orange-500 to-violet-600 p-6 text-white sm:p-10 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <Avatar id={state.profile.avatar} size={110} className="rounded-full bg-white/20" />
        <div>
          <p className="text-sm font-extrabold uppercase tracking-widest text-white/80">Niveau {level.current.rank}</p>
          <h1 className="text-3xl font-black sm:text-4xl">Salut {state.profile.pseudo} !</h1>
          <p className="mt-1 text-lg font-bold text-jaune-100">{level.current.name}</p>
          <div className="mt-4 max-w-md">
            <ProgressBar value={level.progress} label="Progression vers le niveau suivant" color="bg-jaune-300" className="bg-white/25" />
            <p className="mt-1 text-sm text-white/85">{level.next ? `${summary.xp} / ${level.next.minXp} XP pour devenir « ${level.next.name} »` : "Niveau maximum atteint, bravo !"}</p>
          </div>
        </div>
        <div className="flex gap-2 lg:flex-col">
          <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2 text-sm font-extrabold hover:bg-white/25">
            <Pencil className="size-4" aria-hidden /> Mon profil
          </button>
          <Link href="/passeport" className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-violet-700">
            <Globe className="size-4" aria-hidden /> Mon passeport
          </Link>
        </div>
      </section>

      {isSupabaseConfigured && !userId && (
        <p className="rounded-2xl bg-bleu-50 p-4 text-sm font-bold text-bleu-700">
          Ta progression est enregistrée sur cet appareil. <Link href="/connexion" className="underline">Demande à un adulte de créer un compte</Link> pour la retrouver partout.
        </p>
      )}

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ["XP", summary.xp, Sparkles],
          ["Articles lus", summary.articles, BookOpen],
          ["Quiz réussis", summary.quizzesPassed, Gamepad2],
          ["Pays explorés", `${summary.countries}/${countries.length}`, Globe],
          ["Badges", `${summary.badges}/${BADGES.length}`, Trophy],
        ].map(([label, value, I]) => {
          const Ico = I as typeof Sparkles;
          return (
            <div key={label as string} className="rounded-3xl bg-white p-4 shadow-carte ring-1 ring-encre/5">
              <Ico className="size-5 text-orange-600" aria-hidden />
              <dd className="mt-2 text-3xl font-black tabular-nums">{value as string}</dd>
              <dt className="text-sm font-bold text-encre-doux">{label as string}</dt>
            </div>
          );
        })}
      </dl>

      <DailyChallenge />

      <section className="rounded-3xl bg-white p-6 shadow-carte ring-1 ring-encre/5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Mes badges</h2>
          <Link href="/passeport" className="text-sm font-extrabold text-violet-700 hover:underline">
            Tous les badges →
          </Link>
        </div>
        {badgesEarned.length ? (
          <ul className="mt-4 flex flex-wrap gap-4">
            {badgesEarned.map((b) => (
              <li key={b.id} className="flex w-24 flex-col items-center text-center">
                <BadgeMedal badge={b} earned />
                <span className="mt-2 text-xs font-extrabold">{b.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-encre-doux">Pas encore de badge. Ouvre une fiche pays dans Africa Explorer pour gagner ton premier !</p>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-carte ring-1 ring-encre/5">
        <h2 className="text-xl font-black">Pays explorés</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {countries.map((c) => (
            <li key={c.code}>
              <Link href={`/explorer/${c.code.toLowerCase()}`} className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-extrabold ring-2 ${state.countries[c.code] ? "ring-vert-400" : "opacity-50 ring-encre/10 hover:opacity-100"}`}>
                <Flag code={c.code} className="h-5 w-8" title="" /> {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {lastRead.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-black">Mes dernières lectures</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {lastRead.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-2xl font-black">Recommandé pour toi</h2>
        {recommended.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        ) : (
          <p className="rounded-3xl bg-white p-6 text-encre-doux shadow-carte">Tu as tout lu ! De nouvelles lectures arrivent bientôt.</p>
        )}
      </section>

      {challenges.length > 0 && (
        <section className="rounded-3xl bg-violet-50 p-6">
          <h2 className="text-xl font-black">Défis disponibles</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {challenges.map((q) => (
              <li key={q.slug}>
                <Link href={`/challenges/${q.slug}`} className="flex h-full items-center justify-between gap-2 rounded-2xl bg-white p-4 font-extrabold shadow-carte hover:ring-2 hover:ring-violet-300">
                  {q.title} <ArrowRight className="size-4 shrink-0 text-violet-600" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
