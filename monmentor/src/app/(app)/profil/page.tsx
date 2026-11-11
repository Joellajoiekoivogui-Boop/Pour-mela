import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { deleteAccount, requestVerification, updateMentorProfile, updateProfile } from "@/app/actions/profile";
import { Notice, PageHeader, VerifiedBadge } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { DOMAINS, FORMATS, LANGUAGES } from "@/lib/domains";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Mon profil" };

const DAYS = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const ERR: Record<string, string> = {
  preuve: "Indiquez un justificatif (lien LinkedIn, attestation, référence).",
  attente: "Une demande de vérification est déjà en cours d'examen.",
  suppression: "Tapez SUPPRIMER en majuscules pour confirmer.",
};
const Check = ({ name, value, label, checked }: { name: string; value: string; label: string; checked: boolean }) => (
  <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
    <input type="checkbox" name={name} value={value} defaultChecked={checked} className="accent-[var(--accent)]" />{label}
  </label>
);

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string; bienvenue?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const [mentor] = await db.select().from(schema.mentorProfiles).where(eq(schema.mentorProfiles.userId, user.id)).limit(1);
  const [mentee] = await db.select().from(schema.menteeProfiles).where(eq(schema.menteeProfiles.userId, user.id)).limit(1);
  const verifs = mentor ? await db.select().from(schema.verifications).where(eq(schema.verifications.userId, user.id)).orderBy(desc(schema.verifications.createdAt)) : [];

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <PageHeader eyebrow={user.role === "MENTOR" ? "Mentor" : user.role === "ADMIN" ? "Coordination" : "Mentoré·e"} title="Mon profil" lead={user.role === "MENTOR" ? "Un profil complet est mieux recommandé aux jeunes et plus vite vérifié." : "Plus votre besoin est précis, meilleures sont les recommandations."}
        actions={<Link href="/profil/cv" className="btn-ghost">Mon CV</Link>} />
      {sp.bienvenue && <Notice tone="ok">Bienvenue ! Complétez votre profil de mentor ci-dessous : la coordination le vérifie avant de le rendre visible aux jeunes.</Notice>}
      {sp.ok === "1" && <Notice tone="ok">Profil enregistré.</Notice>}
      {sp.ok === "verification" && <Notice tone="ok">Demande de vérification envoyée à la coordination.</Notice>}
      {sp.erreur && ERR[sp.erreur] && <Notice tone="bad">{ERR[sp.erreur]}</Notice>}

      <form action={updateProfile} className="card grid gap-4 p-5" id="preferences">
        <h2 className="font-bold">Informations</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="field sm:col-span-3"><span className="label">Prénom et nom</span><input name="name" defaultValue={user.name} required className="input" /></label>
          <label className="field"><span className="label">Ville</span><input name="city" defaultValue={user.city} className="input" /></label>
          <label className="field"><span className="label">Pays</span><input name="country" defaultValue={user.country} className="input" /></label>
          <label className="field"><span className="label">Rappels par</span>
            <select name="preferredChannel" defaultValue={user.preferredChannel} className="input"><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="email">E-mail</option></select>
          </label>
        </div>
        <p className="hint">Téléphone : {user.phone ?? "non renseigné"} · E-mail : {user.email ?? "non renseigné"}. Les rappels ne sont jamais envoyés entre 22 h et 7 h, sauf celui d&apos;une heure avant la séance.</p>
        <label className="field"><span className="label">Quelques mots sur moi</span><textarea name="bio" rows={3} defaultValue={user.bio ?? ""} maxLength={800} className="input" /></label>
        {mentee && (
          <>
            <label className="field"><span className="label">Ma situation</span>
              <select name="situation" defaultValue={mentee.situation ?? ""} className="input">{["Élève", "Étudiant·e", "Jeune diplômé·e", "Porteur·se de projet", "Entrepreneur·e", "En reconversion"].map((s) => <option key={s}>{s}</option>)}</select>
            </label>
            <label className="field"><span className="label">Mon besoin</span><textarea name="need" rows={3} defaultValue={mentee.need ?? ""} maxLength={2000} className="input" /></label>
            <fieldset><legend className="label mb-2">Domaines qui m&apos;intéressent</legend><div className="flex flex-wrap gap-2">{DOMAINS.map((d) => <Check key={d.id} name="domains" value={d.id} label={d.short} checked={mentee.domains.includes(d.id)} />)}</div></fieldset>
          </>
        )}
        <SubmitButton className="btn-primary justify-self-start">Enregistrer</SubmitButton>
      </form>

      {mentor && (
        <form action={updateMentorProfile} className="card grid gap-4 p-5" id="mentor">
          <div className="flex items-center justify-between"><h2 className="font-bold">Profil de mentor</h2><VerifiedBadge level={mentor.verificationLevel} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field"><span className="label">Fonction</span><input name="title" defaultValue={mentor.title} required className="input" /></label>
            <label className="field"><span className="label">Organisation</span><input name="organization" defaultValue={mentor.organization ?? ""} className="input" /></label>
            <label className="field"><span className="label">Années d&apos;expérience</span><input name="yearsExperience" type="number" min={0} max={60} defaultValue={mentor.yearsExperience} className="input" /></label>
            <label className="field"><span className="label">Mentorés en parallèle</span><input name="capacity" type="number" min={1} max={10} defaultValue={mentor.capacity} className="input" /></label>
            <label className="field"><span className="label">Domaine principal</span>
              <select name="primaryDomain" defaultValue={mentor.primaryDomain} className="input">{DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}</select>
            </label>
            <label className="field"><span className="label">Profil LinkedIn</span><input name="linkedinUrl" type="url" defaultValue={mentor.linkedinUrl ?? ""} className="input" /></label>
          </div>
          <fieldset><legend className="label mb-2">Autres domaines</legend><div className="flex flex-wrap gap-2">{DOMAINS.map((d) => <Check key={d.id} name="domains" value={d.id} label={d.short} checked={mentor.domains.includes(d.id)} />)}</div></fieldset>
          <label className="field"><span className="label">Compétences (séparées par des virgules)</span><input name="skills" defaultValue={mentor.skills.join(", ")} className="input" placeholder="Dossier Campus France, Lettre de motivation, Data science" />
            <span className="hint">Ce sont elles qui comptent le plus dans la recommandation : soyez précis.</span></label>
          <fieldset><legend className="label mb-2">Langues</legend><div className="flex flex-wrap gap-2">{LANGUAGES.map((l) => <Check key={l} name="languages" value={l} label={l} checked={mentor.languages.includes(l)} />)}</div></fieldset>
          <fieldset><legend className="label mb-2">Formats proposés</legend><div className="flex flex-wrap gap-2">{FORMATS.map((f) => <Check key={f.id} name="formats" value={f.id} label={f.label} checked={mentor.formats.includes(f.id)} />)}</div></fieldset>
          <fieldset className="grid gap-2">
            <legend className="label mb-1">Créneaux hebdomadaires <span className="hint font-normal">(heure de Conakry ; décochez pour retirer)</span></legend>
            <div className="flex flex-wrap gap-2">{mentor.slots.map((s) => <Check key={`${s.day}-${s.hour}`} name="slots" value={`${s.day}-${s.hour}`} label={`${DAYS[s.day]} ${s.hour} h`} checked />)}</div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>Ajouter :</span>
              <select name="newDay" className="input w-auto min-h-9 py-1" defaultValue="" aria-label="Jour"><option value="">Jour</option>{DAYS.slice(1).map((d, i) => <option key={d} value={i + 1}>{d}</option>)}</select>
              <select name="newHour" className="input w-auto min-h-9 py-1" defaultValue="" aria-label="Heure"><option value="">Heure</option>{Array.from({ length: 17 }, (_, i) => i + 6).map((h) => <option key={h} value={h}>{h} h</option>)}</select>
            </div>
          </fieldset>
          <SubmitButton className="btn-primary justify-self-start">Enregistrer mon profil de mentor</SubmitButton>
        </form>
      )}

      {mentor && (
        <section className="card grid gap-4 p-5" id="verification">
          <h2 className="font-bold">Vérification</h2>
          <ol className="grid gap-1 text-sm text-ink-2">
            <li className={mentor.verificationLevel >= 1 ? "text-ok" : ""}>1. Identité : pièce d&apos;identité contrôlée par la coordination.</li>
            <li className={mentor.verificationLevel >= 2 ? "text-ok" : ""}>2. Parcours : profil LinkedIn ou attestation employeur. Votre profil devient visible des jeunes majeurs.</li>
            <li className={mentor.verificationLevel >= 3 ? "text-ok" : ""}>3. Entretien de 20 minutes avec la coordination : badge « Vérifié·e », accompagnement des mineurs possible.</li>
          </ol>
          {verifs.length > 0 && <ul className="grid gap-1 text-sm">{verifs.slice(0, 3).map((v) => <li key={v.id}>Niveau {v.level} · {v.status === "PENDING" ? "en cours d'examen" : v.status === "APPROVED" ? "validé" : "refusé"} · {formatDate(v.createdAt)}{v.note ? ` · ${v.note}` : ""}</li>)}</ul>}
          {mentor.verificationLevel < 3 && (
            <form action={requestVerification} className="grid gap-3">
              <input type="hidden" name="level" value={mentor.verificationLevel + 1} />
              <label className="field"><span className="label">Justificatif pour le niveau {mentor.verificationLevel + 1}</span>
                <textarea name="evidence" rows={2} maxLength={500} required className="input" placeholder={mentor.verificationLevel === 0 ? "Je peux présenter ma pièce d'identité en visio ou au bureau de la coordination." : mentor.verificationLevel === 1 ? "Lien LinkedIn, nom et contact d'un responsable pouvant attester de mon poste…" : "Mes disponibilités pour l'entretien de 20 minutes…"} />
              </label>
              <SubmitButton className="btn-ghost justify-self-start">Demander la vérification</SubmitButton>
            </form>
          )}
        </section>
      )}

      <section className="card grid gap-4 p-5" id="donnees">
        <h2 className="font-bold">Mes données</h2>
        <p className="text-sm text-ink-2">Charte acceptée le {user.charterAcceptedAt ? formatDate(user.charterAcceptedAt) : "—"} (version {user.charterVersion ?? "—"}). <Link href="/confidentialite" className="link">Politique de confidentialité</Link></p>
        <a href="/api/moi/export" className="btn-ghost justify-self-start">Télécharger toutes mes données</a>
        <details className="rounded-lg border border-bad/30 p-4">
          <summary className="cursor-pointer font-semibold text-bad">Supprimer mon compte</summary>
          <form action={deleteAccount} className="mt-3 grid gap-3">
            <p className="text-sm">Votre profil, vos séances, messages, objectifs et votre CV seront définitivement supprimés.</p>
            <label className="field"><span className="label">Tapez SUPPRIMER pour confirmer</span><input name="confirm" required className="input" autoComplete="off" /></label>
            <SubmitButton className="btn-danger justify-self-start">Supprimer définitivement</SubmitButton>
          </form>
        </details>
      </section>
    </div>
  );
}
