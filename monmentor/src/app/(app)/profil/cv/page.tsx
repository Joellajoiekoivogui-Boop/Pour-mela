import type { Metadata } from "next";
import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { certUrl, cvUrl, loadCv } from "@/lib/cv";
import { linkedinAddCertificationUrl, shareUrls } from "@/lib/share";
import { addExperience, deleteExperience, resetShareLink, setRecommendationStatus, updateCv } from "@/app/actions/cv";
import { CvView } from "@/components/cv-view";
import { SharePanel } from "@/components/share-panel";
import { Notice, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { isMinor } from "@/lib/format";

export const metadata: Metadata = { title: "Mon CV" };

const FLASH: Record<string, [string, "ok" | "bad"]> = {
  enregistre: ["CV enregistré.", "ok"],
  lien: ["Nouveau lien créé : l'ancien ne fonctionne plus.", "ok"],
  experience: ["Indiquez l'intitulé, l'organisation et l'année de début.", "bad"],
};

export default async function CvEditor({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const d = (await loadCv({ userId: user.id }))!;
  const url = cvUrl(d);
  const firstName = user.name.split(" ")[0];
  const message = user.role === "MENTOR"
    ? `Je suis mentor bénévole sur MonMentor : ${d.impact?.mentees ?? 0} jeunes accompagnés. Voici mon profil d'impact :`
    : `Mon parcours sur MonMentor : compétences validées par mes mentors, objectifs et recommandations.`;
  const shares = await db.select({ channel: schema.shareEvents.channel, n: count() }).from(schema.shareEvents).where(eq(schema.shareEvents.userId, user.id)).groupBy(schema.shareEvents.channel);
  const pending = d.recommendations.filter((r) => r.status === "PENDING");
  const minor = isMinor(user.birthDate);
  const flash = FLASH[sp.ok ?? sp.erreur ?? ""];
  const hide = new Set(d.cv.hidden);

  return (
    <>
      <PageHeader eyebrow="Profil carrière" title="Mon CV" lead={`Il se remplit tout seul avec votre parcours sur MonMentor, ${firstName}. Vous choisissez ce qui est visible et avec qui vous le partagez.`}
        actions={<Link href={url.replace(/^https?:\/\/[^/]+/, "")} className="btn-ghost">Voir la page publique</Link>} />
      {flash && <div className="mb-4"><Notice tone={flash[1]}>{flash[0]}</Notice></div>}
      {pending.map((r) => (
        <form key={r.id} action={setRecommendationStatus} className="card mb-4 grid gap-3 p-4">
          <input type="hidden" name="id" value={r.id} />
          <p className="font-semibold">{r.mentorName} a écrit une recommandation pour vous</p>
          <p className="italic text-ink-2">« {r.body} »</p>
          <div className="flex gap-2"><button name="status" value="APPROVED" className="btn-primary btn-sm">L&apos;afficher sur mon CV</button><button name="status" value="HIDDEN" className="btn-ghost btn-sm">Ne pas l&apos;afficher</button></div>
        </form>
      ))}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid content-start gap-6">
          <section className="card grid gap-4 p-5">
            <h2 className="font-bold">Partager</h2>
            <SharePanel url={url} message={message} links={shareUrls(url, message)} disabled={d.cv.visibility === "PRIVATE"}
              certificates={d.certificates.map((c) => ({ code: c.code, title: c.title, linkedinUrl: linkedinAddCertificationUrl({ name: c.title, issuedAt: c.issuedAt, certUrl: certUrl(c.code), certId: c.code }) }))} />
            <p className="text-xs text-ink-3">Vu {d.cv.viewCount} fois{shares.length ? ` · partagé ${shares.map((s) => `${s.n}× ${s.channel}`).join(", ")}` : ""}.</p>
          </section>

          <form action={updateCv} className="card grid gap-4 p-5">
            <h2 className="font-bold">Contenu et visibilité</h2>
            <fieldset className="grid gap-2">
              <legend className="label mb-1">Qui peut voir mon CV ?</legend>
              {([["PRIVATE", "Privé", "Vous seul·e."], ["LINK", "Avec le lien", "Les personnes à qui vous envoyez le lien."], ["PUBLIC", "Public", "Tout le monde, y compris les moteurs de recherche."]] as const).map(([v, l, h]) => (
                <label key={v} className={`flex items-start gap-3 rounded-lg border border-line p-3 has-[:checked]:border-accent ${minor && v === "PUBLIC" ? "opacity-50" : ""}`}>
                  <input type="radio" name="visibility" value={v} defaultChecked={d.cv.visibility === v} disabled={minor && v === "PUBLIC"} className="mt-1 accent-[var(--accent)]" />
                  <span><span className="font-semibold">{l}</span><span className="block text-xs text-ink-2">{h}</span></span>
                </label>
              ))}
              {minor && <p className="hint">Avant 18 ans, votre CV ne peut pas être public. Le partage par lien demande l&apos;accord de votre parent ou tuteur.</p>}
            </fieldset>
            <label className="field"><span className="label">Titre</span><input name="headline" defaultValue={d.cv.headline ?? ""} maxLength={140} className="input" placeholder="Ex. : Licence 3 informatique · vise un master en IA" /></label>
            <label className="field"><span className="label">Présentation</span><textarea name="summary" defaultValue={d.cv.summary ?? ""} rows={3} maxLength={800} className="input" /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field"><span className="label">Modèle</span>
                <select name="template" defaultValue={d.cv.template} className="input"><option value="sobre">Sobre (emploi)</option><option value="academique">Académique (études, bourses)</option><option value="entrepreneur">Entrepreneur</option></select>
              </label>
              <label className="field"><span className="label">Langue</span>
                <select name="language" defaultValue={d.cv.language} className="input"><option value="fr">Français</option><option value="en">Anglais</option></select>
              </label>
            </div>
            <fieldset className="grid gap-1.5 text-sm">
              <legend className="label mb-1">Masquer</legend>
              {([["city", "Ma ville"], ["goals", "Mes objectifs en cours"], ["sessions", "Le nombre de séances"]] as const).map(([k, l]) => (
                <label key={k} className="flex items-center gap-2"><input type="checkbox" name={`hide_${k}`} defaultChecked={hide.has(k)} className="accent-[var(--accent)]" />{l}</label>
              ))}
            </fieldset>
            <SubmitButton className="btn-primary justify-self-start">Enregistrer</SubmitButton>
          </form>

          <section className="card grid gap-4 p-5">
            <h2 className="font-bold">Expériences et formation</h2>
            <ul className="grid gap-2 text-sm">
              {d.experiences.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3">
                  <span><strong>{e.title}</strong> · {e.organization} <span className="text-ink-3">({e.start} – {e.end ?? "aujourd'hui"})</span></span>
                  <form action={deleteExperience}><input type="hidden" name="id" value={e.id} /><button className="text-xs text-ink-3 hover:text-bad">Retirer</button></form>
                </li>
              ))}
            </ul>
            <form action={addExperience} className="grid gap-3 border-t border-line pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="field"><span className="label">Type</span><select name="kind" className="input"><option value="EXPERIENCE">Expérience</option><option value="EDUCATION">Formation</option></select></label>
                <label className="field"><span className="label">Intitulé</span><input name="title" required className="input" /></label>
                <label className="field"><span className="label">Organisation</span><input name="organization" required className="input" /></label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="field"><span className="label">Début</span><input name="start" required placeholder="2024" maxLength={7} className="input" /></label>
                  <label className="field"><span className="label">Fin</span><input name="end" placeholder="en cours" maxLength={7} className="input" /></label>
                </div>
              </div>
              <label className="field"><span className="label">Description (facultatif)</span><input name="description" maxLength={400} className="input" /></label>
              <SubmitButton className="btn-ghost justify-self-start">Ajouter</SubmitButton>
            </form>
          </section>
          {d.cv.visibility === "LINK" && (
            <form action={resetShareLink} className="text-sm text-ink-2">Lien partagé trop largement ? <button className="link">Créer un nouveau lien</button> (l&apos;ancien cessera de fonctionner).</form>
          )}
        </div>
        <div className="grid content-start gap-2">
          <p className="label">Aperçu</p>
          <CvView d={d} />
        </div>
      </div>
    </>
  );
}
