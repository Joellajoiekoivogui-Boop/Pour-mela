"use client";

import Link from "next/link";
import { BookOpen, BookHeart, CircleCheck, Stamp } from "lucide-react";
import { useProgress } from "@/components/progress/ProgressProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Flag } from "@/components/ui/Flag";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BadgeMedal } from "@/components/progress/BadgeMedal";
import { BADGES } from "@/lib/progress/badges";
import { LEVELS } from "@/lib/progress/levels";
import { countries } from "@/data/countries";
import { articleBySlug } from "@/data/articles";
import { storyBySlug } from "@/data/stories";
import { quizBySlug, PASS_RATIO } from "@/data/quizzes";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export function Passport() {
  const { state, summary, ready } = useProgress();
  if (!ready) return <div className="h-96 animate-pulse rounded-[2rem] bg-white" aria-busy="true" />;

  const passedQuizzes = Object.entries(state.quizResults).filter(([, r]) => r.total && r.best / r.total >= PASS_RATIO);
  return (
    <div className="grid gap-8">
      {/* Couverture */}
      <section className="relative overflow-hidden rounded-[2rem] bg-vert-700 p-6 text-white shadow-2xl sm:p-10">
        <div className="bande-kente absolute inset-x-0 top-0 h-3" aria-hidden />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="rounded-3xl bg-white/10 p-3">{state.profile ? <Avatar id={state.profile.avatar} size={110} /> : <Avatar id="awa" size={110} className="opacity-40" />}</div>
          <div className="flex-1">
            <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-jaune-300">Passeport africain · CONTEVERSE</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">{state.profile?.pseudo ?? "Explorateur anonyme"}</h1>
            <p className="mt-1 text-lg font-bold text-vert-100">
              Niveau {summary.level.current.rank} · {summary.level.current.name}
            </p>
            <div className="mt-4 max-w-md">
              <ProgressBar value={summary.level.progress} label="Progression de niveau" color="bg-jaune-300" className="bg-white/20" />
              <p className="mt-1 text-sm text-white/80">{summary.xp} XP {summary.level.next ? `· prochain niveau à ${summary.level.next.minXp} XP` : ""}</p>
            </div>
          </div>
        </div>
        {!state.profile && (
          <Link href="/dashboard" className="mt-6 inline-block rounded-2xl bg-white px-5 py-3 font-extrabold text-vert-700">
            Créer mon profil d&apos;explorateur
          </Link>
        )}
      </section>

      {/* Tampons */}
      <section aria-labelledby="tampons">
        <h2 id="tampons" className="flex items-center gap-2 text-2xl font-black">
          <Stamp className="size-6 text-orange-600" aria-hidden /> Mes tampons de voyage
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {countries.map((c, i) => {
            const at = state.countries[c.code];
            return (
              <li key={c.code}>
                <Link href={`/explorer/${c.code.toLowerCase()}`} className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-full border-4 border-dashed p-4 text-center transition ${at ? "border-orange-400 bg-orange-50" : "border-encre/10 bg-white opacity-60 hover:opacity-100"}`} style={{ rotate: at ? `${(i % 2 ? 1 : -1) * (4 + i)}deg` : undefined }}>
                  <Flag code={c.code} className="h-8 w-12" title="" />
                  <span className="font-black leading-tight">{c.name}</span>
                  <span className="text-xs font-bold text-encre-doux">{at ? fmt(at) : "À découvrir"}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Badges */}
      <section aria-labelledby="badges" className="rounded-[2rem] bg-white p-6 shadow-carte ring-1 ring-encre/5 sm:p-8">
        <h2 id="badges" className="text-2xl font-black">
          Mes badges ({summary.badges}/{BADGES.length})
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {BADGES.map((b) => {
            const earned = !!state.badges[b.id];
            return (
              <li key={b.id} className="flex flex-col items-center text-center">
                <BadgeMedal badge={b} earned={earned} />
                <p className="mt-3 font-black leading-tight">{b.name}</p>
                <p className="mt-1 text-xs text-encre-doux">{earned ? `Gagné le ${fmt(state.badges[b.id])}` : b.hint}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-3xl bg-white p-6 shadow-carte ring-1 ring-encre/5">
          <h2 className="flex items-center gap-2 text-xl font-black">
            <BookOpen className="size-5 text-orange-600" aria-hidden /> Articles lus ({summary.articles})
          </h2>
          <ul className="mt-3 grid gap-2 text-sm">
            {Object.keys(state.articlesRead).length ? (
              Object.keys(state.articlesRead).map((s) => (
                <li key={s}>
                  <Link href={`/bibliotheque/${s}`} className="font-bold hover:underline">
                    {articleBySlug[s]?.title ?? s}
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-encre-doux">Aucun pour l&apos;instant. <Link href="/bibliotheque" className="font-bold text-orange-700">Choisis une lecture</Link></li>
            )}
          </ul>
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-carte ring-1 ring-encre/5">
          <h2 className="flex items-center gap-2 text-xl font-black">
            <BookHeart className="size-5 text-violet-600" aria-hidden /> Histoires terminées ({summary.stories})
          </h2>
          <ul className="mt-3 grid gap-2 text-sm">
            {Object.keys(state.storiesDone).length ? (
              Object.keys(state.storiesDone).map((s) => (
                <li key={s}>
                  <Link href={`/histoires/${s}`} className="font-bold hover:underline">
                    {storyBySlug[s]?.title ?? s}
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-encre-doux">Aucune pour l&apos;instant. <Link href="/histoires" className="font-bold text-violet-700">Lis une histoire</Link></li>
            )}
          </ul>
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-carte ring-1 ring-encre/5">
          <h2 className="flex items-center gap-2 text-xl font-black">
            <CircleCheck className="size-5 text-vert-600" aria-hidden /> Quiz réussis ({passedQuizzes.length})
          </h2>
          <ul className="mt-3 grid gap-2 text-sm">
            {passedQuizzes.length ? (
              passedQuizzes.map(([slug, r]) => (
                <li key={slug} className="flex justify-between gap-2">
                  <span className="font-bold">{quizBySlug[slug]?.title.replace(/^Quiz : /, "") ?? slug}</span>
                  <span className="shrink-0 text-encre-doux">
                    {r.best}/{r.total}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-encre-doux">Aucun pour l&apos;instant. <Link href="/challenges" className="font-bold text-vert-700">Relève un défi</Link></li>
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-3xl bg-sable/70 p-6" aria-labelledby="niveaux">
        <h2 id="niveaux" className="text-xl font-black">Les niveaux de l&apos;explorateur</h2>
        <ol className="mt-4 grid gap-2 sm:grid-cols-5">
          {LEVELS.map((l) => (
            <li key={l.rank} className={`rounded-2xl p-3 text-center ${summary.level.current.rank >= l.rank ? "bg-vert-500 text-white" : "bg-white text-encre-doux"}`}>
              <p className="text-xs font-extrabold">Niveau {l.rank}</p>
              <p className="font-black">{l.name}</p>
              <p className="text-xs">{l.minXp} XP</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-encre-doux">Les XP récompensent ce que tu comprends : lire un article jusqu&apos;au bout (+20), réussir une question (+10), terminer une histoire (+25), découvrir un pays (+15). Relire ou rejouer ne fait pas gagner plus : prends ton temps !</p>
      </section>
    </div>
  );
}
