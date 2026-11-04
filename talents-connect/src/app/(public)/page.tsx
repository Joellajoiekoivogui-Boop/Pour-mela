import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronDown, Quote, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/public/section";
import { MentorCard } from "@/components/shared/mentor-card";
import { NamedIcon } from "@/components/shared/icon";
import { BENEFITS, DEMO_TESTIMONIALS, FALLBACK_DOMAINS, FAQ, HOW_IT_WORKS } from "@/content/site";
import { getCatalog, getPublicStats, listVerifiedMentors, toCatalog } from "@/lib/queries";
import { getServerSupabase } from "@/lib/supabase/server";


export default async function HomePage() {
  const supabase = await getServerSupabase();
  const [{ domains, skills }, stats, mentors] = await Promise.all([
    getCatalog(),
    getPublicStats(),
    supabase ? listVerifiedMentors(supabase, { limit: 6 }) : Promise.resolve([]),
  ]);
  const catalog = toCatalog(domains, skills);
  const shownDomains = domains.length > 0 ? domains : FALLBACK_DOMAINS;

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" aria-hidden />
        <div className="absolute -top-40 left-1/2 h-[480px] w-[880px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-200/50 via-violet-200/40 to-blue-100/40 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge tone="primary" className="mb-6 whitespace-normal px-3 py-1 text-center text-[12px] sm:text-[13px]">
              <Sparkles /> Salon international du livre de jeunesse de Conakry · 10ᵉ édition
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-navy sm:text-6xl">
              Votre avenir professionnel commence par une <span className="bg-gradient-to-r from-primary to-violet bg-clip-text text-transparent">bonne connexion.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted">
              TALENTS CONNECT met en relation les jeunes talents de Guinée avec des professionnels expérimentés.
              Trouvez un mentor adapté à vos objectifs, organisez vos séances et suivez votre progression.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/inscription?profil=mentore" size="lg">Trouver un mentor <ArrowRight /></ButtonLink>
              <ButtonLink href="/devenir-mentor" size="lg" variant="secondary">Devenir mentor</ButtonLink>
            </div>
            <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
              {["Gratuit pour les jeunes", "Mentors vérifiés", "Matching explicable"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-success" aria-hidden />{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Fonctionnement ─── */}
      <Section id="fonctionnement" eyebrow="Fonctionnement" title="Quatre étapes pour avancer avec un mentor" muted>
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((s, i) => (
            <li key={s.title}>
              <Card className="h-full p-6">
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">{i + 1}</span>
                <h3 className="mt-4 font-semibold text-navy">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
              </Card>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-center"><Link href="/comment-ca-marche" className="text-sm font-medium text-primary hover:underline">En savoir plus sur le fonctionnement →</Link></p>
      </Section>

      {/* ─── Domaines ─── */}
      <Section eyebrow="Domaines d'expertise" title="Des mentors dans les métiers d'aujourd'hui et de demain">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {shownDomains.map((d) => (
            <li key={d.slug}>
              <Link href={`/mentors?domaine=${d.slug}`} className="group flex h-full items-start gap-3 rounded-[var(--radius-card)] border border-border p-4 transition-colors hover:border-primary/40 hover:bg-primary-soft/40">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary group-hover:bg-primary group-hover:text-white"><NamedIcon name={d.icon} className="size-5" /></span>
                <span>
                  <span className="block text-sm font-semibold text-navy">{d.name}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">{d.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* ─── Avantages ─── */}
      <Section eyebrow="Pourquoi TALENTS CONNECT" title="Un accompagnement sérieux, simple et mesurable" muted>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <Card key={b.title} className="p-6">
              <span className="inline-flex size-10 items-center justify-center rounded-lg bg-violet-soft text-violet"><NamedIcon name={b.icon} className="size-5" /></span>
              <h3 className="mt-4 font-semibold text-navy">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{b.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ─── Mentors ─── */}
      <Section eyebrow="Mentors disponibles" title="Ils ont choisi de transmettre">
        {mentors.length > 0 ? (
          <>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {mentors.map((m) => (
                <MentorCard key={m.profile.id} item={m} domainName={catalog.domainName} skillName={catalog.skillName} profileHref={`/mentors/${m.profile.id}`} requestHref={`/mentore/mentors/${m.profile.id}`} />
              ))}
            </div>
            <p className="mt-10 text-center"><ButtonLink href="/mentors" variant="secondary">Voir tous les mentors <ArrowRight /></ButtonLink></p>
          </>
        ) : (
          <Card className="mx-auto max-w-xl p-8 text-center">
            <p className="font-semibold text-navy">Les premiers mentors sont en cours de vérification.</p>
            <p className="mt-2 text-sm text-muted">Vous êtes un professionnel expérimenté ? Rejoignez la communauté.</p>
            <ButtonLink href="/devenir-mentor" className="mt-5">Devenir mentor</ButtonLink>
          </Card>
        )}
      </Section>

      {/* ─── Statistiques (réelles) ─── */}
      {stats && (
        <section className="bg-navy py-16 text-white sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">La communauté en chiffres</h2>
            <p className="mt-2 text-center text-sm text-slate-400">Chiffres réels, calculés en direct à partir de la base de données.</p>
            <dl className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-5">
              {[
                ["Mentors vérifiés", stats.mentors],
                ["Jeunes inscrits", stats.mentees],
                ["Mentorats créés", stats.mentorships],
                ["Séances réalisées", stats.sessions],
                ["Domaines couverts", stats.domains],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[var(--radius-card)] border border-white/10 bg-white/5 p-5 text-center">
                  <dt className="text-sm text-slate-300">{label}</dt>
                  <dd className="mt-1 text-3xl font-semibold">{Number(value).toLocaleString("fr-FR")}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* ─── Témoignages (exemples) ─── */}
      <Section eyebrow="Témoignages" title="Ce que le mentorat peut changer" description="Exemples illustratifs rédigés pour la démonstration : ils ne proviennent pas d'utilisateurs réels.">
        <div className="grid gap-5 md:grid-cols-3">
          {DEMO_TESTIMONIALS.map((t) => (
            <Card key={t.name} className="relative p-6">
              <Badge tone="warning" className="absolute right-4 top-4">Exemple illustratif</Badge>
              <Quote className="size-6 text-primary/30" aria-hidden />
              <blockquote className="mt-3 text-[15px] leading-relaxed text-slate-700">« {t.text} »</blockquote>
              <p className="mt-5 text-sm font-semibold text-navy">{t.name}</p>
              <p className="text-xs text-muted">{t.role}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ─── FAQ ─── */}
      <Section eyebrow="FAQ" title="Questions fréquentes" muted>
        <div className="mx-auto max-w-3xl divide-y divide-border rounded-[var(--radius-card)] border border-border bg-surface">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-navy">
                {f.q}
                <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* ─── Appel à l'action ─── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-violet p-8 text-center text-white sm:p-12">
            <h2 className="text-balance text-2xl font-semibold sm:text-3xl">Prêt à construire votre carrière ?</h2>
            <p className="mx-auto mt-3 max-w-xl text-blue-100">Créez votre profil en deux minutes et découvrez les mentors qui vous correspondent.</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/inscription?profil=mentore" size="lg" className="bg-white text-primary hover:bg-blue-50">Je souhaite être accompagné</ButtonLink>
              <ButtonLink href="/inscription?profil=mentor" size="lg" className="border border-white/40 bg-white/10 text-white hover:bg-white/20">Je souhaite devenir mentor</ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
