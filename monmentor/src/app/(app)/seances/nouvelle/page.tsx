import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { objectivesWithSteps, relationsOf } from "@/lib/queries";
import { createSession } from "@/app/actions/sessions";
import { EmptyState, Notice, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { formatDateTime } from "@/lib/format";
import type { Slot } from "@/db/schema";

export const metadata: Metadata = { title: "Nouvelle séance" };

const ERRORS: Record<string, string> = {
  champs: "Indiquez un titre et un créneau.",
  date: "Choisissez un créneau au moins 30 minutes à l'avance.",
  relation: "Vous devez être en relation de mentorat active avec cette personne.",
  consentement: "L'accord de votre parent ou tuteur est nécessaire avant de demander une séance.",
};

/** Prochaines occurrences des créneaux hebdomadaires d'un mentor (heure de Conakry = UTC). */
function nextOccurrences(slots: Slot[], count = 8, now = Date.now()) {
  const out: number[] = [];
  for (let d = 0; d < 21 && out.length < count * 2; d++) {
    const day = new Date(now + d * 86_400_000);
    const iso = day.getUTCDay() === 0 ? 7 : day.getUTCDay();
    for (const s of slots) {
      if (s.day !== iso) continue;
      const t = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), s.hour);
      if (t > now + 3_600_000) out.push(t);
    }
  }
  return out.sort((a, b) => a - b).slice(0, count);
}

export default async function NewSession({ searchParams }: { searchParams: Promise<{ mentor?: string; mentore?: string; erreur?: string }> }) {
  const user = await requireUser(["MENTOR", "MENTEE"]);
  const sp = await searchParams;
  const relations = (await relationsOf(user.id, user.role as "MENTOR" | "MENTEE")).filter((r) => r.m.status === "ACTIVE");
  const selectedId = (user.role === "MENTEE" ? sp.mentor : sp.mentore) ?? relations[0]?.person.id;
  const selected = relations.find((r) => r.person.id === selectedId);
  if (!relations.length) {
    return (
      <>
        <PageHeader title="Nouvelle séance" />
        <EmptyState title={user.role === "MENTEE" ? "Vous n'avez pas encore de mentor." : "Vous n'avez pas encore de mentoré."} action={user.role === "MENTEE" ? { href: "/trouver", label: "Trouver mon mentor" } : undefined} />
      </>
    );
  }
  const mentorId = user.role === "MENTOR" ? user.id : selected?.person.id;
  const [profile] = mentorId ? await db.select().from(schema.mentorProfiles).where(eq(schema.mentorProfiles.userId, mentorId)).limit(1) : [];
  const slots = profile ? nextOccurrences(profile.slots) : [];
  const menteeId = user.role === "MENTEE" ? user.id : selected?.person.id;
  const objectives = menteeId ? await objectivesWithSteps([menteeId]) : [];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <Link href="/seances" className="text-sm text-ink-2 hover:text-ink">← Mes séances</Link>
      <PageHeader title={user.role === "MENTEE" ? "Demander une séance" : "Programmer une séance"} lead={user.role === "MENTEE" ? "Votre mentor reçoit la demande et la confirme. Vous recevez un rappel la veille et une heure avant." : "La séance est confirmée directement ; votre mentoré reçoit les rappels."} />
      {sp.erreur && ERRORS[sp.erreur] && <Notice tone="bad">{ERRORS[sp.erreur]}</Notice>}
      <nav className="flex flex-wrap gap-2" aria-label="Avec qui">
        {relations.map(({ person }) => (
          <Link key={person.id} href={`/seances/nouvelle?${user.role === "MENTEE" ? "mentor" : "mentore"}=${person.id}`}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${person.id === selectedId ? "bg-brand text-brand-ink" : "bg-surface-2 text-ink-2"}`}>{person.name}</Link>
        ))}
      </nav>
      {selected && (
        <form action={createSession} className="card grid gap-5 p-5">
          <input type="hidden" name="otherId" value={selected.person.id} />
          <label className="field"><span className="label">Sujet de la séance</span><input name="title" required maxLength={120} className="input" placeholder="Ex. : Simulation d'entretien" /></label>
          {slots.length > 0 && (
            <fieldset className="grid gap-2">
              <legend className="label mb-1">Créneaux de {user.role === "MENTEE" ? selected.person.name.split(" ")[0] : "votre agenda"}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {slots.map((t) => (
                  <label key={t} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line p-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                    <input type="radio" name="slot" value={t} className="accent-[var(--accent)]" />{formatDateTime(t)}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <fieldset className="grid gap-2">
            <legend className="label mb-1">{slots.length ? "Ou une autre date" : "Date et heure"} <span className="hint font-normal">(heure de Conakry)</span></legend>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" name="date" min={today} className="input" aria-label="Date" />
              <input type="time" name="time" step={900} className="input" aria-label="Heure" />
            </div>
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field"><span className="label">Durée</span>
              <select name="duration" className="input" defaultValue="45">{[30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} min</option>)}</select>
            </label>
            <label className="field"><span className="label">Format</span>
              <select name="format" className="input" defaultValue="visio">
                {(profile?.formats ?? ["visio"]).map((f) => <option key={f} value={f}>{f === "presentiel" ? "Présentiel" : f === "chat" ? "Chat" : "Visio"}</option>)}
              </select>
            </label>
          </div>
          {objectives.length > 0 && (
            <label className="field"><span className="label">Objectif lié (facultatif)</span>
              <select name="objectiveId" className="input" defaultValue=""><option value="">Aucun</option>{objectives.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}</select>
            </label>
          )}
          <SubmitButton className="btn-primary justify-self-start">{user.role === "MENTEE" ? "Envoyer la demande" : "Programmer la séance"}</SubmitButton>
        </form>
      )}
    </div>
  );
}
