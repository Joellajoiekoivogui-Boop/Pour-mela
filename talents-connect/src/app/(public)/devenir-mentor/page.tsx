import type { Metadata } from "next";
import { CalendarClock, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import { PageHero } from "@/components/public/section";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Devenir mentor" };

const POINTS = [
  { icon: HeartHandshake, title: "Transmettre", text: "Partagez votre parcours avec des jeunes motivés et aidez-les à éviter les erreurs que vous avez faites." },
  { icon: CalendarClock, title: "À votre rythme", text: "Vous publiez vos créneaux et fixez le nombre maximal de mentorés. Une séance d'une heure par mois suffit pour commencer." },
  { icon: ShieldCheck, title: "Un cadre sûr", text: "Profils vérifiés, messagerie privée, signalement en un clic et modération par l'équipe." },
  { icon: Sparkles, title: "Des outils qui font gagner du temps", text: "Suivi des objectifs, notes de séance, assistant IA pour préparer vos rencontres." },
];

export default function BecomeMentorPage() {
  return (
    <>
      <PageHero eyebrow="Mentors" title="Devenez mentor sur TALENTS CONNECT" description="Votre expérience peut changer une trajectoire. Rejoignez les professionnels qui accompagnent la prochaine génération de talents guinéens.">
        <ButtonLink href="/inscription?profil=mentor" size="lg">Je souhaite devenir mentor</ButtonLink>
      </PageHero>
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2">
          {POINTS.map((p) => (
            <Card key={p.title} className="p-6">
              <span className="inline-flex size-10 items-center justify-center rounded-lg bg-violet-soft text-violet"><p.icon className="size-5" /></span>
              <h2 className="mt-4 font-semibold text-navy">{p.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.text}</p>
            </Card>
          ))}
        </div>
        <Card className="mt-10 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-navy">Comment se passe la vérification ?</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>Créez votre compte mentor et complétez votre profil : poste, entreprise, expériences, domaines et compétences.</li>
            <li>Un administrateur examine votre profil. Vous êtes notifié de sa décision dans votre espace.</li>
            <li>Une fois vérifié, votre profil apparaît dans l&apos;annuaire et dans les recommandations des mentorés.</li>
          </ol>
        </Card>
      </div>
    </>
  );
}
