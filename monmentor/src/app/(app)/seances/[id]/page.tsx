import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { displayStatus, STATUS_LABEL } from "@/lib/session-status";
import { Avatar, Badge, Notice, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { ReportButton } from "@/components/report-button";
import { cancelSession, closeSession, joinSession, rateSession, respondSession } from "@/app/actions/sessions";
import { formatDateTime, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Séance" };

const FLASH: Record<string, [string, "ok" | "bad"]> = {
  cloture: ["Compte rendu enregistré. Les prochaines actions ont été ajoutées aux objectifs.", "ok"],
  avis: ["Merci pour votre avis.", "ok"],
  horaire: ["La salle ouvre 15 minutes avant le début de la séance.", "bad"],
  resume: ["Écrivez au moins une phrase de compte rendu.", "bad"],
  note: ["Choisissez une note de 1 à 5.", "bad"],
};

export default async function SessionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  const [s] = await db.select().from(schema.sessions).where(eq(schema.sessions.id, id)).limit(1);
  if (!s || (s.mentorId !== user.id && s.menteeId !== user.id && user.role !== "ADMIN")) notFound();
  const otherId = s.mentorId === user.id ? s.menteeId : s.mentorId;
  const [other] = otherId ? await db.select().from(schema.users).where(eq(schema.users.id, otherId)).limit(1) : [];
  const [objective] = s.objectiveId ? await db.select().from(schema.objectives).where(eq(schema.objectives.id, s.objectiveId)).limit(1) : [];
  const now = Date.now();
  const d = displayStatus(s, now);
  const isMentor = s.mentorId === user.id;
  const isMentee = s.menteeId === user.id;
  const canJoin = s.status === "CONFIRMED" && now >= s.startsAt - 15 * 60_000 && now <= s.startsAt + (s.durationMin + 30) * 60_000;
  const flash = FLASH[sp.ok ?? sp.erreur ?? ""];

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <Link href="/seances" className="text-sm text-ink-2 hover:text-ink">← Mes séances</Link>
      <PageHeader eyebrow={STATUS_LABEL[d]} title={s.title} lead={`${formatDateTime(s.startsAt)} → ${formatTime(s.startsAt + s.durationMin * 60_000)} · ${s.format === "presentiel" ? "en présentiel" : s.format === "chat" ? "par chat" : "en visio"}`} />
      {flash && <Notice tone={flash[1]}>{flash[0]}</Notice>}

      <section className="card flex flex-wrap items-center gap-4 p-5">
        {other && <><Avatar name={other.name} size={48} /><div><p className="font-semibold">{other.name}</p><p className="text-sm text-ink-2">{isMentor ? "Mentoré·e" : "Mentor"} · {other.city}</p></div></>}
        <div className="ml-auto flex flex-wrap gap-2">
          {otherId && <Link href={`/messages/${otherId}`} className="btn-ghost btn-sm">Écrire</Link>}
          {otherId && <ReportButton targetType="SESSION" targetId={s.id} targetUserId={otherId} />}
        </div>
        {objective && <p className="w-full text-sm text-ink-2">Objectif lié : <Link href="/objectifs" className="link">{objective.title}</Link></p>}
      </section>

      {isMentor && s.status === "REQUESTED" && d === "REQUESTED" && (
        <form action={respondSession} className="card flex flex-wrap items-center gap-3 p-5">
          <input type="hidden" name="id" value={s.id} />
          <p className="flex-1 font-semibold">Cette séance attend votre réponse.</p>
          <button name="decision" value="accept" className="btn-primary">Confirmer</button>
          <button name="decision" value="decline" className="btn-ghost">Décliner</button>
        </form>
      )}

      {(d === "CONFIRMED" || d === "LIVE") && s.format !== "presentiel" && (
        <section className="card grid gap-3 p-5">
          <h2 className="font-bold">Rejoindre la séance</h2>
          {canJoin ? (
            <div className="flex flex-wrap gap-2">
              <form action={joinSession}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="mode" value="video" /><SubmitButton>Rejoindre en visio</SubmitButton></form>
              <form action={joinSession}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="mode" value="audio" /><SubmitButton className="btn-dark">Rejoindre en audio seul</SubmitButton></form>
              {otherId && <Link href={`/messages/${otherId}`} className="btn-ghost">Passer au chat</Link>}
            </div>
          ) : <p className="text-sm text-ink-2">La salle ouvre 15 minutes avant le début.</p>}
          <p className="hint">Connexion faible ? L&apos;audio seul consomme environ dix fois moins de données que la vidéo. Si l&apos;appel coupe, continuez par le chat : l&apos;historique est conservé.</p>
        </section>
      )}

      {(s.status === "REQUESTED" || s.status === "CONFIRMED") && s.startsAt > now && (
        <form action={cancelSession} className="flex justify-end"><input type="hidden" name="id" value={s.id} /><button className="btn-danger btn-sm">Annuler la séance</button></form>
      )}

      {s.summary && (
        <section className="card grid gap-2 p-5">
          <h2 className="font-bold">Compte rendu du mentor</h2>
          <p>{s.summary}</p>
          {s.nextActions && s.nextActions.length > 0 && <><p className="label mt-2">Prochaines actions</p><ul className="list-disc pl-5 text-sm">{s.nextActions.map((a) => <li key={a}>{a}</li>)}</ul></>}
          {s.skillWorked && <p className="text-sm text-ink-2">Compétence travaillée : {s.skillWorked}</p>}
        </section>
      )}

      {isMentor && !s.summary && s.startsAt <= now && ["CONFIRMED", "TO_REVIEW", "COMPLETED"].includes(s.status) && (
        <form action={closeSession} className="card grid gap-4 p-5">
          <input type="hidden" name="id" value={s.id} />
          <h2 className="font-bold">Clôturer la séance · 2 minutes</h2>
          <label className="field"><span className="label">Ce qui a été vu</span><textarea name="summary" required rows={3} maxLength={2000} className="input" /></label>
          <label className="field"><span className="label">Prochaines actions (une par ligne, 3 au plus)</span><textarea name="nextActions" rows={3} className="input" placeholder={"Relire la lettre de motivation\nPréparer 3 questions pour la prochaine séance"} />
            <span className="hint">Elles deviennent des étapes de l&apos;objectif du mentoré, à échéance de deux semaines.</span></label>
          <label className="field"><span className="label">Compétence travaillée (facultatif)</span><input name="skill" maxLength={60} className="input" /></label>
          <SubmitButton className="btn-primary justify-self-start">Enregistrer le compte rendu</SubmitButton>
        </form>
      )}

      {isMentee && s.startsAt <= now && ["CONFIRMED", "TO_REVIEW", "COMPLETED"].includes(s.status) && (
        s.rating ? (
          <p className="text-sm text-ink-2">Votre avis : {"★".repeat(s.rating)}{"☆".repeat(5 - s.rating)}{s.ratingComment ? ` · « ${s.ratingComment} »` : ""}</p>
        ) : (
          <form action={rateSession} className="card grid gap-4 p-5">
            <input type="hidden" name="id" value={s.id} />
            <h2 className="font-bold">Comment s&apos;est passée cette séance ?</h2>
            <fieldset className="flex gap-2">
              <legend className="sr-only">Note sur 5</legend>
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="grid h-11 w-11 cursor-pointer place-items-center rounded-lg border border-line text-lg has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                  <input type="radio" name="rating" value={n} required className="sr-only" />{n}
                </label>
              ))}
            </fieldset>
            <label className="field"><span className="label">Un commentaire pour votre mentor (facultatif)</span><textarea name="comment" rows={2} maxLength={600} className="input" /></label>
            <SubmitButton className="btn-primary justify-self-start">Envoyer mon avis</SubmitButton>
          </form>
        )
      )}
      {d === "NO_SHOW" && <Notice tone="warn">Personne ne s&apos;est connecté dans les 15 minutes : la séance est comptée comme une absence.</Notice>}
      {d === "COMPLETED" && <Badge tone="ok">Séance terminée</Badge>}
    </div>
  );
}
