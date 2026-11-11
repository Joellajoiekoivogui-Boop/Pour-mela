import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { activeMentorship, completedSessionsBetween, objectivesWithSteps, sessionsFor } from "@/lib/queries";
import { commentObjective } from "@/app/actions/objectives";
import { endorseSkill, writeRecommendation } from "@/app/actions/cv";
import { endMentorship } from "@/app/actions/mentorship";
import { ObjectiveCard } from "@/components/objective-card";
import { Avatar, Notice, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { displayStatus, STATUS_LABEL } from "@/lib/session-status";
import { ageFrom, formatDateTime } from "@/lib/format";
import { DomainChips } from "@/components/ui";

export const metadata: Metadata = { title: "Fiche mentoré" };

export default async function MenteeFile({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const user = await requireUser(["MENTOR"]);
  const { id } = await params;
  const sp = await searchParams;
  const relation = await activeMentorship(user.id, id);
  if (!relation) notFound();
  const [mentee] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  const [mp] = await db.select().from(schema.menteeProfiles).where(eq(schema.menteeProfiles.userId, id)).limit(1);
  const objectives = await objectivesWithSteps([id]);
  const sessions = (await sessionsFor(user.id, "MENTOR")).filter((s) => s.menteeId === id).reverse();
  const done = await completedSessionsBetween(user.id, id);
  const endorsements = await db.select().from(schema.skillEndorsements).where(and(eq(schema.skillEndorsements.menteeId, id), eq(schema.skillEndorsements.mentorId, user.id)));
  const [profile] = await db.select().from(schema.mentorProfiles).where(eq(schema.mentorProfiles.userId, user.id)).limit(1);
  const canVouch = done >= 2;
  const age = ageFrom(mentee!.birthDate);

  return (
    <div className="grid gap-6">
      <Link href="/mentores" className="text-sm text-ink-2 hover:text-ink">← Mes mentorés</Link>
      <PageHeader title={mentee!.name} lead={`${mp?.situation ?? "Mentoré·e"} · ${mentee!.city}${age !== null ? ` · ${age} ans` : ""}`}
        actions={<><Link href={`/seances/nouvelle?mentore=${id}`} className="btn-primary">Programmer une séance</Link><Link href={`/messages/${id}`} className="btn-ghost">Écrire</Link></>} />
      {sp.ok === "recommandation" && <Notice tone="ok">Recommandation envoyée : elle apparaîtra sur le CV après approbation.</Notice>}
      {sp.erreur && <Notice tone="bad">{sp.erreur === "seances" ? "Il faut au moins 2 séances terminées ensemble pour valider une compétence." : "Une recommandation fait au moins 40 caractères et demande 2 séances terminées ensemble."}</Notice>}
      {age !== null && age < 18 && <Notice tone="warn">Mentoré·e mineur·e : séances en visio uniquement, messagerie fermée de 22 h à 6 h.</Notice>}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid content-start gap-4">
          {mp?.need && <section className="card grid gap-2 p-5"><h2 className="font-bold">Son besoin</h2><p className="text-ink-2">{mp.need}</p><DomainChips ids={mp.domains} short={false} /></section>}
          <h2 className="text-lg font-bold">Objectifs</h2>
          {objectives.length === 0 && <p className="text-sm text-ink-2">Pas encore d&apos;objectif. Proposez-lui d&apos;en créer un lors de la prochaine séance.</p>}
          {objectives.map((o) => (
            <ObjectiveCard key={o.id} o={o} commenter={o.mentorCommentBy === user.id ? user.name : null}>
              <form action={commentObjective} className="grid gap-2">
                <input type="hidden" name="objectiveId" value={o.id} />
                <label className="sr-only" htmlFor={`c-${o.id}`}>Conseil</label>
                <textarea id={`c-${o.id}`} name="comment" rows={2} maxLength={600} defaultValue={o.mentorCommentBy === user.id ? o.mentorComment ?? "" : ""} className="input text-sm" placeholder="Laisser un conseil sur cet objectif" />
                <SubmitButton className="btn-ghost btn-sm justify-self-start">Enregistrer le conseil</SubmitButton>
              </form>
            </ObjectiveCard>
          ))}
        </div>
        <div className="grid content-start gap-4">
          <section className="card grid gap-3 p-5">
            <h2 className="font-bold">Séances ({sessions.length})</h2>
            <ul className="grid gap-1.5 text-sm">
              {sessions.slice(0, 8).map((s) => <li key={s.id} className="flex justify-between gap-2"><Link href={`/seances/${s.id}`} className="link">{s.title}</Link><span className="text-ink-3">{STATUS_LABEL[displayStatus(s)]} · {formatDateTime(s.startsAt).split(" à ")[0]}</span></li>)}
            </ul>
          </section>
          <section className="card grid gap-3 p-5">
            <h2 className="font-bold">Valider une compétence</h2>
            <p className="text-sm text-ink-2">Elle apparaît sur son CV avec votre nom. {canVouch ? "" : `Possible après 2 séances terminées (${done}/2).`}</p>
            {endorsements.length > 0 && <p className="text-sm">Déjà validées : {endorsements.map((e) => e.skill).join(", ")}</p>}
            <form action={endorseSkill} className="flex gap-2">
              <input type="hidden" name="menteeId" value={id} />
              <input name="skill" list="skills" required maxLength={60} disabled={!canVouch} className="input min-h-9 text-sm" placeholder="Compétence" aria-label="Compétence à valider" />
              <datalist id="skills">{(profile?.skills ?? []).map((s) => <option key={s} value={s} />)}</datalist>
              <SubmitButton className="btn-ghost btn-sm" disabled={!canVouch}>Valider</SubmitButton>
            </form>
          </section>
          <section className="card grid gap-3 p-5">
            <h2 className="font-bold">Écrire une recommandation</h2>
            <form action={writeRecommendation} className="grid gap-2">
              <input type="hidden" name="menteeId" value={id} />
              <textarea name="body" rows={4} minLength={40} maxLength={600} required disabled={!canVouch} className="input text-sm" placeholder="Ce que vous avez observé : ses progrès, ses qualités, un exemple concret." />
              <SubmitButton className="btn-ghost btn-sm justify-self-start" disabled={!canVouch}>Envoyer pour approbation</SubmitButton>
            </form>
          </section>
          <form action={endMentorship} className="justify-self-end"><input type="hidden" name="id" value={relation.id} /><button className="text-xs font-semibold text-ink-3 hover:text-bad">Terminer l&apos;accompagnement</button></form>
        </div>
      </div>
    </div>
  );
}
