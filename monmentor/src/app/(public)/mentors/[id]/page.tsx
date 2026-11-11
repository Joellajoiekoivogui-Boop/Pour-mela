import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getPublicMentor, mentorImpact } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { Avatar, Badge, DemoBadge, DomainChips, Notice, Stat, VerifiedBadge } from "@/components/ui";
import { ReportButton } from "@/components/report-button";
import { SubmitButton } from "@/components/submit-button";
import { requestMentorship } from "@/app/actions/mentorship";
import { FORMATS } from "@/lib/domains";
import { plural } from "@/lib/format";
import { DEMO_MODE } from "@/lib/env";

const DAYS = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const m = await getPublicMentor((await params).id);
  return m ? { title: m.name, description: `${m.title} · mentor sur MonMentor` } : { title: "Mentor introuvable" };
}

const MESSAGES: Record<string, [string, "ok" | "bad" | "warn"]> = {
  demande: ["Demande envoyée. Le mentor reçoit une notification et vous répond depuis MonMentor.", "ok"],
  deja: ["Vous avez déjà une demande ou un accompagnement en cours avec ce mentor.", "warn"],
  complet: ["Ce mentor n'a plus de place pour le moment.", "bad"],
  niveau: ["Avant 18 ans, vous pouvez être accompagné·e uniquement par un mentor au badge « Vérifié·e ».", "bad"],
  consentement: ["L'accord de votre parent ou tuteur est nécessaire avant votre première demande. Vérifiez votre profil.", "warn"],
  introuvable: ["Ce mentor n'est pas disponible.", "bad"],
};

export default async function MentorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const m = await getPublicMentor(id);
  if (!m) notFound();
  const [user, impact, resources] = await Promise.all([
    getCurrentUser(),
    mentorImpact(id),
    db.select().from(schema.resources).where(and(eq(schema.resources.authorId, id), eq(schema.resources.hidden, false))).orderBy(desc(schema.resources.createdAt)).limit(4),
  ]);
  const [profile] = await db.select().from(schema.mentorProfiles).where(eq(schema.mentorProfiles.userId, id)).limit(1);
  const relation = user
    ? (await db.select().from(schema.mentorships).where(and(eq(schema.mentorships.mentorId, id), eq(schema.mentorships.menteeId, user.id))).limit(1))[0]
    : undefined;
  const places = m.capacity - m.activeMentees;
  const flash = MESSAGES[sp.ok ?? sp.erreur ?? ""];

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 lg:grid-cols-[1fr_320px]">
      <div className="grid content-start gap-6">
        <Link href="/mentors" className="text-sm text-ink-2 hover:text-ink">← Tous les mentors</Link>
        {flash && <Notice tone={flash[1]}>{flash[0]}</Notice>}
        <section className="card grid gap-4 p-6">
          <div className="flex flex-wrap items-start gap-4">
            <Avatar name={m.name} size={72} />
            <div className="grid flex-1 gap-1">
              <h1 className="text-2xl font-bold">{m.name}</h1>
              <p className="text-ink-2">{m.title}{m.organization ? ` · ${m.organization}` : ""}</p>
              <p className="text-sm text-ink-3">{m.city}, {m.country} · {plural(m.yearsExperience, "an")} d&apos;expérience</p>
              <div className="mt-1 flex flex-wrap gap-1.5"><VerifiedBadge level={m.verificationLevel} /><DemoBadge show={DEMO_MODE && m.isDemo} /></div>
            </div>
            {user && user.id !== m.id && <ReportButton targetType="USER" targetId={m.id} targetUserId={m.id} />}
          </div>
          {m.bio && <p className="text-ink-2">{m.bio}</p>}
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="label mb-1">Domaines</dt><dd><DomainChips ids={[m.primaryDomain, ...m.domains.filter((d) => d !== m.primaryDomain)]} short={false} /></dd></div>
            <div><dt className="label mb-1">Compétences</dt><dd className="flex flex-wrap gap-1.5">{m.skills.map((s) => <span key={s} className="chip">{s}</span>)}</dd></div>
            <div><dt className="label mb-1">Langues</dt><dd>{m.languages.join(", ")}</dd></div>
            <div><dt className="label mb-1">Formats</dt><dd>{m.formats.map((f) => FORMATS.find((x) => x.id === f)?.label ?? f).join(", ")}</dd></div>
            {profile && profile.slots.length > 0 && (
              <div className="sm:col-span-2"><dt className="label mb-1">Créneaux habituels</dt>
                <dd className="flex flex-wrap gap-1.5">{profile.slots.map((s) => <span key={`${s.day}-${s.hour}`} className="chip">{DAYS[s.day]} {s.hour} h</span>)}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="grid gap-3">
          <h2 className="text-lg font-bold">Profil d&apos;impact</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Jeunes accompagnés" value={impact.mentees} />
            <Stat label="Heures données" value={impact.hours.toLocaleString("fr-FR")} />
            <Stat label="Séances" value={impact.sessionsDone} />
            <Stat label="Ressources" value={impact.resources} />
          </div>
        </section>

        {resources.length > 0 && (
          <section className="grid gap-3">
            <h2 className="text-lg font-bold">Ressources partagées</h2>
            <ul className="grid gap-2">
              {resources.map((r) => (
                <li key={r.id} className="card p-4"><Link href={`/ressources/${r.id}`} className="font-semibold hover:underline">{r.title}</Link><p className="text-sm text-ink-2">{r.summary}</p></li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside className="grid content-start gap-4 lg:sticky lg:top-20">
        <div className="card grid gap-3 p-5">
          <p className="font-semibold">{places > 0 ? plural(places, "place libre", "places libres") : "Complet pour le moment"}</p>
          {m.ratingCount >= 3 && m.ratingAvg != null && <p className="text-sm text-ink-2">★ {m.ratingAvg.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}/5 sur {plural(m.ratingCount, "avis", "avis")}</p>}
          {!user && (
            <>
              <p className="text-sm text-ink-2">Créez votre compte gratuit pour demander un mentorat.</p>
              <Link href={`/inscription?suite=/mentors/${m.id}`} className="btn-primary">Créer mon compte</Link>
              <Link href={`/connexion?suite=/mentors/${m.id}`} className="btn-ghost">J&apos;ai déjà un compte</Link>
            </>
          )}
          {user?.role === "MENTEE" && relation?.status === "ACTIVE" && (
            <>
              <Badge tone="ok">Vous êtes accompagné·e</Badge>
              <Link href={`/seances/nouvelle?mentor=${m.id}`} className="btn-primary">Demander une séance</Link>
              <Link href={`/messages/${m.id}`} className="btn-ghost">Écrire</Link>
            </>
          )}
          {user?.role === "MENTEE" && relation?.status === "PENDING" && <Badge tone="warn">Demande en attente de réponse</Badge>}
          {user?.role === "MENTEE" && (!relation || relation.status === "DECLINED" || relation.status === "ENDED") && places > 0 && (
            <form action={requestMentorship} className="grid gap-3">
              <input type="hidden" name="mentorId" value={m.id} />
              <label className="field"><span className="label">Votre message</span>
                <textarea name="message" rows={4} maxLength={800} required className="input" placeholder="Présentez-vous et dites ce que vous attendez de cet accompagnement." />
              </label>
              <SubmitButton>Demander un mentorat</SubmitButton>
            </form>
          )}
          {user && user.role !== "MENTEE" && <p className="text-sm text-ink-3">Seuls les comptes mentorés peuvent demander un mentorat.</p>}
        </div>
        <p className="px-1 text-xs text-ink-3">Les échanges se font sur MonMentor. Un mentor ne vous demandera jamais d&apos;argent : <Link href="/charte" className="link">lire la charte</Link>.</p>
      </aside>
    </div>
  );
}
