import Link from "next/link";
import { analyzeNeed } from "@/lib/need-analysis";
import { matchingCandidates, listPublicMentors } from "@/lib/queries";
import { recommend, weightsFromEnv, type Need } from "@/lib/matching";
import { DOMAINS, domainLabel, isDomain, type DomainId } from "@/lib/domains";
import { MentorCard } from "./mentor-card";
import { EmptyState } from "./ui";
import { db, schema } from "@/db";
import { newId } from "@/lib/ids";

type Props = {
  action: string;
  besoin: string;
  domainesForces?: string[];
  ajuste?: boolean;
  menteeId?: string;
  city?: string | null;
  country?: string | null;
  anonymous?: boolean;
};

export async function Recommendation({ action, besoin, domainesForces = [], ajuste, menteeId, city, country, anonymous }: Props) {
  const analysis = besoin.trim().length >= 8 ? await analyzeNeed(besoin) : null;
  const domains: DomainId[] = ajuste ? domainesForces.filter(isDomain) : analysis?.domains ?? [];
  let results: Awaited<ReturnType<typeof recommend>> = [];
  if (analysis) {
    const need: Need = { ...analysis, domains, city: city ?? "Conakry", country: country ?? "Guinée" };
    results = recommend(need, await matchingCandidates(menteeId), weightsFromEnv());
  }
  const top = results.slice(0, 3);
  const others = results.slice(3, 9).filter((r) => r.score >= 30);
  const byId = new Map((await listPublicMentors(results.slice(0, 9).map((r) => r.mentor.id))).map((m) => [m.id, m]));
  if (menteeId && top.length) {
    await db.insert(schema.matchEvents).values(top.map((r) => ({ id: newId(), menteeId, mentorId: r.mentor.id, event: "SHOWN" as const, score: r.score, createdAt: Date.now() })));
  }

  return (
    <div className="grid gap-8">
      <form action={action} method="get" className="card grid gap-4 p-5">
        <label className="field">
          <span className="label">De quoi avez-vous besoin ?</span>
          <textarea name="besoin" rows={3} required minLength={8} maxLength={2000} defaultValue={besoin} className="input" placeholder="Expliquez votre situation comme vous le feriez à un ami." />
        </label>
        {analysis && (
          <fieldset className="grid gap-2">
            <legend className="label mb-1">Domaines retenus <span className="hint font-normal">(décochez ou ajoutez, puis relancez)</span></legend>
            <input type="hidden" name="ajuste" value="1" />
            <div className="flex flex-wrap gap-2">
              {DOMAINS.map((d) => (
                <label key={d.id} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                  <input type="checkbox" name="d" value={d.id} defaultChecked={domains.includes(d.id)} className="accent-[var(--accent)]" />
                  {d.short}
                </label>
              ))}
            </div>
            {analysis.skills.length > 0 && <p className="hint">Compétences repérées : {analysis.skills.join(", ")}.</p>}
          </fieldset>
        )}
        <button className="btn-primary justify-self-start">{analysis ? "Relancer la recherche" : "Trouver mon mentor"}</button>
      </form>

      {analysis && (
        <section className="grid gap-4" aria-live="polite">
          <h2 className="text-xl font-bold">{top.length ? `${top.length} mentor${top.length > 1 ? "s" : ""} pour vous` : "Aucun mentor disponible pour ce besoin"}</h2>
          {top.length === 0 && (
            <EmptyState title="Personne ne correspond encore à ce besoin.">
              Essayez d&apos;autres mots ou <Link className="link" href="/mentors">parcourez l&apos;annuaire</Link>.
            </EmptyState>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            {top.map((r, i) => {
              const m = byId.get(r.mentor.id);
              if (!m) return null;
              return (
                <MentorCard key={m.id} m={m}>
                  <div className="grid gap-2 rounded-lg bg-surface-2 p-3 text-sm">
                    <div className="flex items-center justify-between font-semibold">
                      <span>{i === 0 ? "Meilleur choix" : "Compatibilité"}</span>
                      <span className="tabular-nums">{r.score} %</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-line"><div className="h-full rounded-full bg-ok" style={{ width: `${r.score}%` }} /></div>
                    <ul className="grid gap-1 text-ink-2">{r.reasons.map((x) => <li key={x}>· {x}</li>)}</ul>
                  </div>
                  {anonymous ? (
                    <Link href={`/inscription?suite=/mentors/${m.id}`} className="btn-primary btn-sm">Créer mon compte pour le contacter</Link>
                  ) : r.mentor.alreadyRelated ? (
                    <Link href={`/messages/${m.id}`} className="btn-ghost btn-sm">Déjà en relation · Écrire</Link>
                  ) : (
                    <Link href={`/mentors/${m.id}`} className="btn-primary btn-sm">Voir le profil et demander</Link>
                  )}
                </MentorCard>
              );
            })}
          </div>
          {others.length > 0 && (
            <details className="card p-4">
              <summary className="cursor-pointer font-semibold">Autres profils pertinents ({others.length})</summary>
              <ul className="mt-3 grid gap-2 text-sm">
                {others.map((r) => (
                  <li key={r.mentor.id} className="flex justify-between gap-3">
                    <Link href={`/mentors/${r.mentor.id}`} className="link">{r.mentor.name}</Link>
                    <span className="text-ink-3">{domainLabel(r.mentor.primaryDomain, true)} · {r.score} %</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <p className="rounded-lg bg-surface-2 p-4 text-sm text-ink-2">
            Comment est calculée la compatibilité ? Les compétences du mentor qui répondent à votre besoin comptent pour 40 %, son domaine pour 20 %, ses places libres pour 15 %, le format et la langue pour 10 %, la proximité pour 10 % et les avis pour 5 %.
            {analysis.source === "ia" ? " Votre texte a été analysé par un modèle d'IA, puis vérifié par mots-clés." : " Votre texte a été analysé par mots-clés."} C&apos;est vous qui choisissez.
          </p>
        </section>
      )}
    </div>
  );
}
