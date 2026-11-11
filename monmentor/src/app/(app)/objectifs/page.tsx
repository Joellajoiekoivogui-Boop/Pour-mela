import type { Metadata } from "next";
import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { objectivesWithSteps, relationsOf } from "@/lib/queries";
import { addStep, createObjective, deleteObjective, toggleStep } from "@/app/actions/objectives";
import { ObjectiveCard } from "@/components/objective-card";
import { EmptyState, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { DOMAINS } from "@/lib/domains";

export const metadata: Metadata = { title: "Objectifs" };

export default async function ObjectivesPage() {
  const user = await requireUser(["MENTOR", "MENTEE"]);
  if (user.role === "MENTOR") {
    const mentees = (await relationsOf(user.id, "MENTOR")).filter((r) => r.m.status === "ACTIVE");
    const objs = await objectivesWithSteps(mentees.map((r) => r.person.id));
    return (
      <>
        <PageHeader eyebrow="Suivi des parcours" title="Objectifs de mes mentorés" lead="Suivez la progression de chacun et laissez un conseil depuis sa fiche." />
        {mentees.length === 0 ? <EmptyState title="Pas encore de mentoré." /> : (
          <div className="grid gap-6">
            {mentees.map(({ person }) => (
              <section key={person.id} className="grid gap-3">
                <h2 className="flex items-center justify-between text-lg font-bold">{person.name}<Link href={`/mentores/${person.id}`} className="link text-sm">Ouvrir sa fiche</Link></h2>
                {objs.filter((o) => o.menteeId === person.id).map((o) => <ObjectiveCard key={o.id} o={o} />)}
                {!objs.some((o) => o.menteeId === person.id) && <p className="text-sm text-ink-3">Aucun objectif pour le moment.</p>}
              </section>
            ))}
          </div>
        )}
      </>
    );
  }
  const objs = await objectivesWithSteps([user.id]);
  const commenterIds = [...new Set(objs.map((o) => o.mentorCommentBy).filter(Boolean))] as string[];
  const names = new Map(commenterIds.length ? (await db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users).where(inArray(schema.users.id, commenterIds))).map((u) => [u.id, u.name]) : []);
  const [mp] = await db.select().from(schema.menteeProfiles).where(eq(schema.menteeProfiles.userId, user.id)).limit(1);
  const overall = objs.length ? Math.round(objs.reduce((a, o) => a + o.progress, 0) / objs.length) : 0;
  return (
    <>
      <PageHeader eyebrow="Mon parcours" title="Mes objectifs" lead={`Un objectif clair, découpé en petites étapes, partagé avec votre mentor. Progression moyenne : ${overall} %.`} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid content-start gap-4">
          {objs.length === 0 ? <EmptyState title="Créez votre premier objectif avec le formulaire.">Exemple : « Déposer mon dossier Campus France », en 5 étapes.</EmptyState>
            : objs.map((o) => <ObjectiveCard key={o.id} o={o} editable toggle={toggleStep} addStep={addStep} remove={deleteObjective} commenter={o.mentorCommentBy ? names.get(o.mentorCommentBy) : null} />)}
        </div>
        <form action={createObjective} className="card grid content-start gap-4 p-5 lg:sticky lg:top-32">
          <h2 className="font-bold">Nouvel objectif</h2>
          <label className="field"><span className="label">Intitulé</span><input name="title" required maxLength={140} className="input" placeholder="Ex. : Décrocher un stage en développement web" /></label>
          <label className="field"><span className="label">Domaine</span>
            <select name="domain" className="input" defaultValue={mp?.domains?.[0] ?? "insertion"}>{DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}</select>
          </label>
          <label className="field"><span className="label">Échéance</span><input type="date" name="dueDate" className="input" min={new Date().toISOString().slice(0, 10)} /></label>
          <label className="field"><span className="label">Étapes (une par ligne)</span><textarea name="steps" rows={4} className="input" placeholder={"Refaire mon CV\nRepérer 5 offres\nEnvoyer 3 candidatures"} /></label>
          <SubmitButton className="btn-primary justify-self-start">Créer l&apos;objectif</SubmitButton>
        </form>
      </div>
    </>
  );
}
