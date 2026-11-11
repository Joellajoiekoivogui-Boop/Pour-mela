import Link from "next/link";
import { listPublicMentors } from "@/lib/queries";
import { MentorCard } from "@/components/mentor-card";
import { DOMAINS } from "@/lib/domains";

export const dynamic = "force-dynamic";

const EXAMPLES = [
  "Je prépare mon dossier Campus France",
  "Je veux créer mon entreprise de transformation agricole",
  "Je cherche mon premier emploi",
  "Je dois pitcher mon projet devant un jury",
];

export default async function Home() {
  const mentors = (await listPublicMentors()).filter((m) => m.verificationLevel >= 3).slice(0, 6);
  return (
    <>
      <section className="bg-[#1b2533] text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.2fr_1fr] md:py-20">
          <div className="grid content-start gap-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#f5a35b]">Mentorat · Conakry et diaspora</p>
            <h1 className="text-4xl font-bold sm:text-5xl">
              Un mentor pour <span className="text-[#f5a35b]">vos ambitions.</span>
            </h1>
            <p className="max-w-xl text-lg opacity-85">
              Décrivez votre besoin avec vos mots. MonMentor vous présente des professionnels vérifiés qui sont passés par là, et vous explique pourquoi.
            </p>
            <form action="/recommandation" method="get" className="grid gap-3 rounded-xl bg-surface p-3 text-ink shadow-lg sm:grid-cols-[1fr_auto]">
              <label htmlFor="besoin" className="sr-only">Votre besoin</label>
              <input id="besoin" name="besoin" required minLength={8} className="input border-0" placeholder="Ex. : je veux faire un master en IA en France" />
              <button className="btn-primary">Trouver mon mentor</button>
            </form>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="opacity-70">Essayez :</span>
              {EXAMPLES.map((e) => (
                <Link key={e} href={`/recommandation?besoin=${encodeURIComponent(e)}`} className="rounded-full border border-white/25 px-3 py-1 hover:bg-white/10">{e}</Link>
              ))}
            </div>
          </div>
          <ol className="grid content-center gap-3">
            {[
              ["Je décris mon besoin", "Études, emploi, entreprise, prise de parole : en quelques phrases, comme à un ami."],
              ["Je choisis mon mentor", "Des professionnels vérifiés, avec les raisons de chaque recommandation."],
              ["Je progresse", "Séances en visio, audio ou en présentiel, objectifs découpés en étapes, CV qui se remplit tout seul."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4 rounded-xl border border-white/15 bg-white/5 p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f08c35] font-bold text-[#1b2533]">{i + 1}</span>
                <span><strong className="block">{t}</strong><span className="text-sm opacity-80">{d}</span></span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-2">
            <p className="eyebrow">Ils transmettent</p>
            <h2 className="text-2xl font-bold sm:text-3xl">Des professionnels vérifiés, prêts à partager</h2>
          </div>
          <Link href="/mentors" className="btn-ghost">Voir tous les mentors</Link>
        </div>
        {mentors.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{mentors.map((m) => <MentorCard key={m.id} m={m} />)}</div>
        ) : (
          <p className="card p-6 text-ink-2">Les premiers mentors sont en cours de vérification. <Link className="link" href="/devenir-mentor">Et si c&apos;était vous ?</Link></p>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <h2 className="mb-4 text-xl font-bold">Huit domaines d&apos;accompagnement</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DOMAINS.map((d) => (
            <li key={d.id}><Link href={`/mentors?domaine=${d.id}`} className="card block p-4 font-semibold hover:border-accent">{d.label}</Link></li>
          ))}
        </ul>
      </section>

      <section className="mx-auto mt-14 grid max-w-6xl gap-4 px-4 md:grid-cols-3">
        {[
          ["Mentors vérifiés", "Identité, parcours puis entretien avec la coordination : seuls les mentors vérifiés apparaissent sur le site."],
          ["Un cadre clair", "Une charte de conduite acceptée par tous, un bouton « Signaler » partout, des règles renforcées pour les moins de 18 ans."],
          ["Un CV qui se partage", "Compétences validées par vos mentors, recommandations et certificats vérifiables, à partager sur LinkedIn, Facebook ou WhatsApp."],
        ].map(([t, d]) => (
          <div key={t} className="card grid gap-2 p-5">
            <h3 className="font-semibold">{t}</h3>
            <p className="text-sm text-ink-2">{d}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <div className="grid gap-6 rounded-2xl bg-accent-soft p-6 sm:p-10 md:grid-cols-[1.5fr_1fr] md:items-center">
          <div className="grid gap-3">
            <p className="eyebrow">Devenir mentor</p>
            <h2 className="text-2xl font-bold">« Le mentor ne fait pas à la place. Il aide à devenir autonome. »</h2>
            <p className="text-ink-2">Entrepreneurs, cadres, experts, en Guinée ou dans la diaspora : donnez une heure par semaine. Vous choisissez vos domaines, vos créneaux et le nombre de jeunes que vous accompagnez.</p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link href="/inscription?role=mentor" className="btn-primary">Je deviens mentor</Link>
            <Link href="/devenir-mentor" className="btn-ghost">En savoir plus</Link>
          </div>
        </div>
      </section>
    </>
  );
}
