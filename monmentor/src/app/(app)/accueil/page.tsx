import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { mentorImpact, objectivesWithSteps, relationsOf, sessionsFor } from "@/lib/queries";
import { displayStatus, isUpcoming, STATUS_LABEL } from "@/lib/session-status";
import { Avatar, Badge, EmptyState, Notice, PageHeader, Progress, Stat } from "@/components/ui";
import { daysUntil, formatDateTime, formatShortDate } from "@/lib/format";
import { domainLabel } from "@/lib/domains";
import { needsParentalConsent } from "@/lib/guards";
import { respondMentorship } from "@/app/actions/mentorship";

export const metadata: Metadata = { title: "Accueil" };

export default async function Dashboard() {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/admin");
  const now = Date.now();
  const sessions = await sessionsFor(user.id, user.role);
  const withStatus = sessions.map((s) => ({ ...s, d: displayStatus(s, now) }));
  const upcoming = withStatus.filter((s) => isUpcoming(s.d) && s.d !== "REQUESTED");
  const next = upcoming[0];
  const relations = await relationsOf(user.id, user.role);
  const active = relations.filter((r) => r.m.status === "ACTIVE");

  if (user.role === "MENTOR") {
    const [profile] = await db.select().from(schema.mentorProfiles).where(eq(schema.mentorProfiles.userId, user.id)).limit(1);
    const pendingMentorships = relations.filter((r) => r.m.status === "PENDING");
    const sessionRequests = withStatus.filter((s) => s.d === "REQUESTED");
    const toClose = withStatus.filter((s) => s.d === "TO_REVIEW" && !s.summary);
    const impact = await mentorImpact(user.id);
    return (
      <>
        <PageHeader eyebrow="Espace mentor" title={`Bonjour ${user.name.split(" ")[0]}`} lead="Ce qui demande votre attention aujourd'hui." />
        {profile && profile.verificationLevel < 2 && (
          <div className="mb-6"><Notice tone="warn">Votre profil n&apos;est pas encore visible des jeunes : la coordination vérifie votre parcours. <Link href="/profil" className="link">Compléter mon profil</Link> accélère la vérification.</Notice></div>
        )}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Mentorés" value={`${active.length}/${profile?.capacity ?? 0}`} />
          <Stat label="Séances terminées" value={impact.sessionsDone} />
          <Stat label="Heures données" value={impact.hours.toLocaleString("fr-FR")} />
          <Stat label="Ressources" value={impact.resources} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="grid content-start gap-3">
            <h2 className="text-lg font-bold">À traiter</h2>
            {pendingMentorships.length + sessionRequests.length + toClose.length === 0 && <EmptyState title="Rien en attente.">Les demandes de mentorat et de séance apparaîtront ici.</EmptyState>}
            {pendingMentorships.map(({ m, person }) => (
              <div key={m.id} className="card grid gap-3 p-4">
                <div className="flex items-center gap-3"><Avatar name={person.name} /><div><p className="font-semibold">{person.name} souhaite être accompagné·e</p><p className="text-xs text-ink-3">{person.city}</p></div></div>
                {m.message && <p className="rounded-lg bg-surface-2 p-3 text-sm">« {m.message} »</p>}
                <form action={respondMentorship} className="flex gap-2">
                  <input type="hidden" name="id" value={m.id} />
                  <button name="decision" value="accept" className="btn-primary btn-sm">Accepter</button>
                  <button name="decision" value="decline" className="btn-ghost btn-sm">Décliner</button>
                </form>
              </div>
            ))}
            {sessionRequests.map((s) => (
              <Link key={s.id} href={`/seances/${s.id}`} className="card flex items-center justify-between gap-3 p-4 hover:border-accent">
                <span><span className="block font-semibold">Séance demandée : {s.title}</span><span className="text-sm text-ink-2">{s.menteeName} · {formatDateTime(s.startsAt)}</span></span>
                <Badge tone="warn">Répondre</Badge>
              </Link>
            ))}
            {toClose.map((s) => (
              <Link key={s.id} href={`/seances/${s.id}`} className="card flex items-center justify-between gap-3 p-4 hover:border-accent">
                <span><span className="block font-semibold">Compte rendu à écrire : {s.title}</span><span className="text-sm text-ink-2">{s.menteeName} · 2 minutes</span></span>
                <Badge tone="accent">Clôturer</Badge>
              </Link>
            ))}
          </section>
          <section className="grid content-start gap-3">
            <h2 className="text-lg font-bold">Prochaines séances</h2>
            {upcoming.length === 0 ? <EmptyState title="Aucune séance prévue." action={{ href: "/seances/nouvelle", label: "Programmer une séance" }} /> : upcoming.slice(0, 4).map((s) => (
              <Link key={s.id} href={`/seances/${s.id}`} className="card flex items-center justify-between gap-3 p-4 hover:border-accent">
                <span><span className="block font-semibold">{s.title}</span><span className="text-sm text-ink-2">{s.menteeName} · {formatDateTime(s.startsAt)}</span></span>
                <Badge tone={s.d === "LIVE" ? "ok" : "info"}>{STATUS_LABEL[s.d]}</Badge>
              </Link>
            ))}
            <h2 className="mt-4 text-lg font-bold">Mes mentorés</h2>
            {active.length === 0 ? <EmptyState title="Pas encore de mentoré.">Les jeunes vous trouvent par l&apos;annuaire et la recommandation.</EmptyState> : (
              <ul className="grid gap-2">{active.map(({ person }) => (
                <li key={person.id}><Link href={`/mentores/${person.id}`} className="card flex items-center gap-3 p-3 hover:border-accent"><Avatar name={person.name} size={34} /><span className="font-medium">{person.name}</span><span className="ml-auto text-xs text-ink-3">{person.city}</span></Link></li>
              ))}</ul>
            )}
          </section>
        </div>
      </>
    );
  }

  // Mentoré
  const [mp] = await db.select().from(schema.menteeProfiles).where(eq(schema.menteeProfiles.userId, user.id)).limit(1);
  const objectives = await objectivesWithSteps([user.id]);
  const toRate = withStatus.filter((s) => (s.d === "TO_REVIEW" || s.d === "COMPLETED") && !s.rating);
  const pendingRecos = await db.select({ r: schema.recommendations, mentor: schema.users }).from(schema.recommendations)
    .innerJoin(schema.users, eq(schema.users.id, schema.recommendations.mentorId))
    .where(and(eq(schema.recommendations.menteeId, user.id), eq(schema.recommendations.status, "PENDING")));
  const domains = mp?.domains?.length ? mp.domains : ["etudes", "numerique", "entrepreneuriat", "insertion"];
  const opportunities = await db.select().from(schema.opportunities)
    .where(and(inArray(schema.opportunities.domain, domains), eq(schema.opportunities.hidden, false), gte(schema.opportunities.deadline, new Date().toISOString().slice(0, 10))))
    .orderBy(schema.opportunities.deadline).limit(4);
  const totalSteps = objectives.reduce((a, o) => a + o.steps.length, 0);
  const doneSteps = objectives.reduce((a, o) => a + o.steps.filter((s) => s.done).length, 0);
  const latestNotifs = await db.select().from(schema.notifications)
    .where(and(eq(schema.notifications.userId, user.id), eq(schema.notifications.channel, "inapp"))).orderBy(desc(schema.notifications.createdAt)).limit(3);

  return (
    <>
      <PageHeader eyebrow="Mon parcours" title={`Bonjour ${user.name.split(" ")[0]}`} lead="De quoi avez-vous besoin aujourd'hui ?"
        actions={<><Link href="/trouver" className="btn-primary">Trouver un mentor</Link><Link href="/objectifs" className="btn-ghost">Nouvel objectif</Link></>} />
      {needsParentalConsent(user) && <div className="mb-6"><Notice tone="warn">En attente de l&apos;accord de votre parent ou tuteur ({user.parentName}). Un SMS lui a été envoyé. Vous pourrez demander un mentorat dès son accord.</Notice></div>}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Mentors" value={active.length} />
        <Stat label="Séances réalisées" value={withStatus.filter((s) => s.d === "COMPLETED" || s.d === "TO_REVIEW").length} />
        <Stat label="Étapes franchies" value={`${doneSteps}/${totalSteps}`} />
        <Stat label="Opportunités suivies" value={(await db.select().from(schema.opportunityInterests).where(eq(schema.opportunityInterests.userId, user.id))).length} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="grid content-start gap-6">
          <section className="card grid gap-3 p-5">
            <h2 className="font-bold">Prochaine séance</h2>
            {next ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="font-semibold">{next.title}</p><p className="text-sm text-ink-2">avec {next.mentorName} · {formatDateTime(next.startsAt)}</p></div>
                <Link href={`/seances/${next.id}`} className="btn-primary btn-sm">{next.d === "LIVE" ? "Rejoindre" : "Voir"}</Link>
              </div>
            ) : <p className="text-sm text-ink-2">Aucune séance planifiée. {active.length ? <Link href="/seances/nouvelle" className="link">Demander une séance</Link> : <Link href="/trouver" className="link">Trouver un mentor</Link>}</p>}
          </section>
          {(toRate.length > 0 || pendingRecos.length > 0) && (
            <section className="grid gap-2">
              {toRate.map((s) => <Notice key={s.id}>Évaluez votre séance « {s.title} » : votre avis aide les autres membres. <Link href={`/seances/${s.id}`} className="link">Donner mon avis</Link></Notice>)}
              {pendingRecos.map(({ r, mentor }) => <Notice key={r.id} tone="ok">{mentor.name} a écrit une recommandation pour votre CV. <Link href="/profil/cv" className="link">La relire et l&apos;approuver</Link></Notice>)}
            </section>
          )}
          <section className="grid gap-3">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Mes objectifs</h2><Link href="/objectifs" className="link text-sm">Tout voir</Link></div>
            {objectives.length === 0 ? <EmptyState title="Pas encore d'objectif." action={{ href: "/objectifs", label: "Créer mon premier objectif" }}>Un objectif clair, découpé en petites étapes, partagé avec votre mentor : c&apos;est ainsi que les projets avancent.</EmptyState> : objectives.map((o) => (
              <Link key={o.id} href="/objectifs" className="card grid gap-2 p-4 hover:border-accent">
                <div className="flex items-start justify-between gap-3"><span className="font-semibold">{o.title}</span><span className="whitespace-nowrap text-sm font-semibold tabular-nums">{o.progress} %</span></div>
                <Progress value={o.progress} label={o.title} />
                <span className="text-xs text-ink-3">{o.next ? `Prochaine étape : ${o.next}` : "Toutes les étapes sont franchies"}{o.dueDate ? ` · échéance ${formatShortDate(o.dueDate)}` : ""}</span>
              </Link>
            ))}
          </section>
        </div>
        <div className="grid content-start gap-6">
          <section className="grid gap-3">
            <h2 className="text-lg font-bold">Mes mentors</h2>
            {active.length === 0 ? <EmptyState title="Pas encore de mentor." action={{ href: "/trouver", label: "Trouver mon mentor" }} /> : (
              <ul className="grid gap-2">{active.map(({ person }) => (
                <li key={person.id} className="card flex items-center gap-3 p-3"><Avatar name={person.name} size={34} /><Link href={`/mentors/${person.id}`} className="font-medium hover:underline">{person.name}</Link><Link href={`/messages/${person.id}`} className="ml-auto text-sm link">Écrire</Link></li>
              ))}</ul>
            )}
          </section>
          <section className="grid gap-3">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Opportunités pour vous</h2><Link href="/opportunites" className="link text-sm">Toutes</Link></div>
            {opportunities.length === 0 ? <p className="text-sm text-ink-2">Aucune opportunité ouverte dans vos domaines pour le moment.</p> : opportunities.map((o) => (
              <Link key={o.id} href="/opportunites" className="card grid gap-1 p-4 hover:border-accent">
                <span className="text-xs font-bold uppercase tracking-wide text-accent">{o.type} · {domainLabel(o.domain, true)}</span>
                <span className="font-semibold">{o.title}</span>
                <span className="text-xs text-ink-3">{o.organization} · J-{daysUntil(o.deadline)}</span>
              </Link>
            ))}
          </section>
          {latestNotifs.length > 0 && (
            <section className="grid gap-2">
              <h2 className="text-lg font-bold">Dernières nouvelles</h2>
              {latestNotifs.map((n) => <Link key={n.id} href={n.link ?? "/notifications"} className="text-sm text-ink-2 hover:text-ink">· {n.body}</Link>)}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
