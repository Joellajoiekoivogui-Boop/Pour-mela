import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createOpportunity, createResource } from "@/app/actions/content";
import { Notice, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { DOMAINS } from "@/lib/domains";

export const metadata: Metadata = { title: "Contribuer" };
const ERR: Record<string, string> = {
  verification: "Votre profil doit être vérifié (niveau 2) avant de publier.",
  ressource: "Complétez tous les champs ; le contenu fait au moins 40 caractères.",
  opportunite: "Complétez le titre, l'organisation, la description et la date limite.",
  lien: "Le lien de l'annonce doit commencer par https://.",
};

export default async function Contribute({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  await requireUser(["MENTOR", "ADMIN"]);
  const { erreur } = await searchParams;
  return (
    <div className="mx-auto grid max-w-3xl gap-8">
      <PageHeader eyebrow="Transmettre" title="Contribuer" lead="Un conseil que vous répétez souvent mérite d'être écrit une fois pour toutes. Il aidera des dizaines de membres." />
      {erreur && ERR[erreur] && <Notice tone="bad">{ERR[erreur]}</Notice>}
      <form action={createResource} className="card grid gap-4 p-5">
        <h2 className="text-lg font-bold">Partager une ressource</h2>
        <label className="field"><span className="label">Titre</span><input name="title" required maxLength={140} className="input" /></label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="field"><span className="label">Type</span><select name="type" className="input"><option value="guide">Guide</option><option value="checklist">Check-list</option><option value="modele">Modèle</option><option value="livre">Livre conseillé</option><option value="video">Vidéo</option></select></label>
          <label className="field"><span className="label">Domaine</span><select name="domain" className="input">{DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.short}</option>)}</select></label>
          <label className="field"><span className="label">Lecture (min)</span><input name="minutes" type="number" min={1} max={120} className="input" /></label>
        </div>
        <label className="field"><span className="label">Résumé</span><input name="summary" required maxLength={300} className="input" /></label>
        <label className="field"><span className="label">Contenu</span><textarea name="body" required rows={10} maxLength={8000} className="input font-mono text-sm" />
          <span className="hint">« ## » pour un intertitre, « - » ou « 1. » pour une liste, **texte** pour le gras.</span></label>
        <SubmitButton className="btn-primary justify-self-start">Publier la ressource</SubmitButton>
      </form>
      <form action={createOpportunity} className="card grid gap-4 p-5" id="opportunite">
        <h2 className="text-lg font-bold">Publier une opportunité</h2>
        <label className="field"><span className="label">Intitulé</span><input name="title" required maxLength={140} className="input" /></label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="field"><span className="label">Type</span><select name="type" className="input capitalize">{["stage", "emploi", "bourse", "concours", "incubation", "evenement"].map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
          <label className="field"><span className="label">Domaine</span><select name="domain" className="input">{DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.short}</option>)}</select></label>
          <label className="field"><span className="label">Date limite</span><input name="deadline" type="date" required min={new Date().toISOString().slice(0, 10)} className="input" /></label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="field"><span className="label">Organisation</span><input name="organization" required maxLength={120} className="input" /></label>
          <label className="field"><span className="label">Lieu</span><input name="location" maxLength={80} placeholder="Conakry, en ligne…" className="input" /></label>
        </div>
        <label className="field"><span className="label">Description</span><textarea name="description" required rows={4} maxLength={1500} className="input" /></label>
        <label className="field"><span className="label">Lien de l&apos;annonce (facultatif)</span><input name="url" type="url" placeholder="https://" className="input" /></label>
        <p className="hint">Les mentorés intéressés par ce domaine sont prévenus par notification.</p>
        <SubmitButton className="btn-primary justify-self-start">Publier l&apos;opportunité</SubmitButton>
      </form>
    </div>
  );
}
