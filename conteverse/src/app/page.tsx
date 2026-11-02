import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpen, CloudOff, Gamepad2, HeartHandshake, Map, MessageCircle, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { HeroArt } from "@/components/home/HeroArt";
import { CategoryCard } from "@/components/home/CategoryCard";
import { CountryCard } from "@/components/explorer/CountryCard";
import { StoryCard } from "@/components/stories/StoryCard";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { LumoMascot } from "@/components/ui/Avatar";
import { Flag } from "@/components/ui/Flag";
import { Scene } from "@/components/ui/Scene";
import { WelcomeLine } from "@/components/home/WelcomeLine";
import { categories } from "@/data/categories";
import { countries, countryByCode } from "@/data/countries";
import { stories } from "@/data/stories";
import { articleBySlug, articlesByCategory } from "@/data/articles";
import { challengeQuizzes } from "@/data/quizzes";
import { AFRICAN_UN_MEMBERS } from "@/data/africa";

const guinee = countryByCode.GN;

const REGIONS = [
  { name: "Guinée maritime", desc: "Océan, mangroves et rizières. Conakry, Boké, Kindia.", scene: "mer" as const },
  { name: "Moyenne-Guinée", desc: "Plateaux et cascades du Fouta-Djalon. Labé, Mamou.", scene: "fouta" as const },
  { name: "Haute-Guinée", desc: "Savanes et fleuve Niger. Kankan, Faranah.", scene: "savane" as const },
  { name: "Guinée forestière", desc: "Forêts et mont Nimba. N'Zérékoré.", scene: "foret" as const },
];

const ADVANTAGES = [
  { icon: BadgeCheck, title: "Des contenus sourcés", text: "Chaque article indique ses sources et précise quand les historiens ne sont pas d'accord. Les contes sont toujours distingués des faits." },
  { icon: CloudOff, title: "Pensé pour les connexions limitées", text: "Pages légères, illustrations vectorielles, application installable et articles à enregistrer pour lire hors connexion." },
  { icon: ShieldCheck, title: "Sûr pour les enfants", text: "Pas de publicité, données personnelles minimales, assistant LUMO encadré par des garde-fous adaptés aux mineurs." },
  { icon: HeartHandshake, title: "Avec les parents et les enseignants", text: "Un espace pour suivre les lectures, les thèmes explorés et les résultats aux quiz." },
];

export default function HomePage() {
  const featured = ["independance-guinee-1958", "fouta-djalon-chateau-eau", "empire-du-mali-soundiata"].map((s) => articleBySlug[s]);
  return (
    <>
      {/* 1. Hero */}
      <section className="motif relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-12 sm:py-16 lg:grid-cols-2 lg:py-20">
          <div>
            <WelcomeLine />
            <h1 className="mt-4 text-4xl font-black leading-[1.05] sm:text-6xl">
              Découvre l&apos;<span className="text-orange-600">Afrique</span>, comprends le <span className="text-bleu-600">monde</span>, imagine <span className="text-violet-600">demain</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-encre-doux sm:text-xl">
              CONTEVERSE est l&apos;encyclopédie interactive des enfants de 7 à 12 ans : histoire, cultures, langues, nature et sciences de la Guinée et de toute l&apos;Afrique, à lire, à écouter et à explorer.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/explorer" className="text-lg">
                <Map className="size-5" aria-hidden /> Explorer l&apos;Afrique
              </ButtonLink>
              <ButtonLink href="/dashboard" variant="secondary" className="text-lg">
                <BookOpen className="size-5" aria-hidden /> Commencer à apprendre
              </ButtonLink>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                [String(AFRICAN_UN_MEMBERS), "pays sur la carte"],
                ["12", "univers"],
                [String(challengeQuizzes.length), "défis à relever"],
              ].map(([n, l]) => (
                <div key={l} className="rounded-2xl bg-white/80 p-3 text-center shadow-carte">
                  <dt className="sr-only">{l}</dt>
                  <dd className="text-2xl font-black text-orange-600">{n}</dd>
                  <dd className="text-xs font-bold text-encre-doux">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <HeroArt />
        </div>
      </section>

      {/* 2. Guinée */}
      <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="titre-guinee">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-carte ring-1 ring-encre/5">
          <div className="grid lg:grid-cols-5">
            <div className="p-8 lg:col-span-2 lg:p-10">
              <Flag code="GN" className="h-10 w-16" title="Drapeau de la Guinée" />
              <p className="mt-6 text-sm font-extrabold uppercase tracking-widest text-orange-600">Notre point de départ</p>
              <h2 id="titre-guinee" className="mt-2 text-3xl font-black sm:text-4xl">
                Découvre la Guinée
              </h2>
              <p className="mt-3 text-lg text-encre-doux">
                Du « non » historique de 1958 aux sources du Fouta-Djalon, en passant par le balafon sacré de Niagassola : la Guinée est la première étape de ton voyage.
              </p>
              <ul className="mt-6 grid gap-2 text-sm font-bold">
                <li>📍 Capitale : {guinee.capital}</li>
                <li>🗓️ Indépendance : {guinee.independence?.date}</li>
                <li>⛰️ Point culminant : mont Nimba (environ 1 752 m)</li>
              </ul>
              <ButtonLink href="/guinee" className="mt-8">
                Entrer dans l&apos;espace Guinée <ArrowRight className="size-5" aria-hidden />
              </ButtonLink>
            </div>
            <div className="grid gap-3 bg-sable/60 p-4 sm:grid-cols-2 lg:col-span-3 lg:p-6">
              {REGIONS.map((r) => (
                <Link key={r.name} href="/guinee#regions" className="group overflow-hidden rounded-2xl bg-white shadow-carte transition hover:-translate-y-0.5">
                  <Scene name={r.scene} className="h-28 w-full" />
                  <div className="p-4">
                    <h3 className="font-black group-hover:text-orange-700">{r.name}</h3>
                    <p className="text-sm text-encre-doux">{r.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Pays africains */}
      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="titre-pays">
        <SectionTitle eyebrow="Africa Explorer" title="Explore les pays africains" id="titre-pays">
          Clique sur la carte, découvre un pays, et fais tamponner ton passeport africain. Cinq fiches sont déjà ouvertes, les autres arrivent.
        </SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((c) => (
            <CountryCard key={c.code} country={c} />
          ))}
          <Link href="/explorer" className="flex items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-orange-300 p-4 font-extrabold text-orange-700 hover:bg-orange-50">
            Voir la carte des {AFRICAN_UN_MEMBERS} pays <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
      </section>

      {/* 4. Univers */}
      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="titre-univers">
        <SectionTitle eyebrow="12 univers" title="Les univers de découverte" id="titre-univers">
          Histoire, sciences, musique, sport, nature… choisis ce qui te rend curieux aujourd&apos;hui.
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <CategoryCard key={c.slug} category={c} count={articlesByCategory(c.slug).length} compact />
          ))}
        </div>
      </section>

      {/* 5. Histoires */}
      <section className="bg-violet-50/60 py-16" aria-labelledby="titre-histoires">
        <div className="mx-auto max-w-6xl px-4">
          <SectionTitle eyebrow="StoryVerse" title="Les histoires du moment" id="titre-histoires">
            Des contes, des épopées et des aventures où c&apos;est toi qui choisis la suite. Chaque histoire dit clairement si elle est inventée ou historique.
          </SectionTitle>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stories.map((s) => (
              <StoryCard key={s.slug} story={s} />
            ))}
          </div>
        </div>
      </section>

      {/* À lire */}
      <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="titre-lire">
        <SectionTitle eyebrow="Bibliothèque" title="À lire en ce moment" id="titre-lire" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <ButtonLink href="/bibliotheque" variant="secondary">
            Toute la bibliothèque <ArrowRight className="size-5" aria-hidden />
          </ButtonLink>
        </div>
      </section>

      {/* 6. Apprends en t'amusant */}
      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="titre-jeux">
        <div className="grid gap-6 rounded-[2rem] bg-encre p-8 text-white sm:p-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-widest text-jaune-300">Africa Challenge</p>
            <h2 id="titre-jeux" className="mt-2 text-3xl font-black sm:text-4xl">
              Apprends en t&apos;amusant
            </h2>
            <p className="mt-3 text-lg text-white/80">
              Quiz sur les pays, les drapeaux, l&apos;histoire et les sciences. Chaque réponse est expliquée, et tu gagnes des XP quand tu comprends — pas quand tu restes longtemps devant l&apos;écran.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/challenges" variant="violet">
                <Gamepad2 className="size-5" aria-hidden /> Relever un défi
              </ButtonLink>
              <ButtonLink href="/passeport" variant="secondary">
                <Trophy className="size-5" aria-hidden /> Mon passeport
              </ButtonLink>
            </div>
          </div>
          <ol className="grid gap-3">
            {[
              ["Petit curieux", "0 XP"],
              ["Explorateur", "100 XP"],
              ["Découvreur", "250 XP"],
              ["Ambassadeur du savoir", "500 XP"],
              ["Gardien du patrimoine", "900 XP"],
            ].map(([n, xp], i) => (
              <li key={n} className="flex items-center gap-4 rounded-2xl bg-white/10 px-4 py-3">
                <span className="grid size-9 place-items-center rounded-full bg-jaune-400 font-black text-encre">{i + 1}</span>
                <span className="font-extrabold">{n}</span>
                <span className="ml-auto text-sm text-white/60">{xp}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 7. LUMO */}
      <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="titre-lumo">
        <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr]">
          <LumoMascot size={180} className="mx-auto" />
          <div>
            <p className="text-sm font-extrabold uppercase tracking-widest text-violet-600">CONTEVERSE AI</p>
            <h2 id="titre-lumo" className="mt-2 text-3xl font-black sm:text-4xl">
              Voici LUMO, ton compagnon de lecture
            </h2>
            <p className="mt-3 text-lg text-encre-doux">
              Pose-lui une question sur la Guinée, l&apos;histoire africaine ou un mot difficile. LUMO répond simplement, s&apos;appuie sur les contenus vérifiés de CONTEVERSE, et te dit honnêtement quand il ne sait pas.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Qui était Soundiata Keïta ?", "Qu'est-ce que le Fouta-Djalon ?", "Combien de pays compte l'Afrique ?"].map((q) => (
                <Link key={q} href={`/assistant?q=${encodeURIComponent(q)}`} className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700 hover:bg-violet-100">
                  <MessageCircle className="size-4" aria-hidden /> {q}
                </Link>
              ))}
            </div>
            <ButtonLink href="/assistant" variant="violet" className="mt-6">
              <Sparkles className="size-5" aria-hidden /> Parler à LUMO
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* 8. Avantages */}
      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="titre-avantages">
        <SectionTitle eyebrow="Pourquoi CONTEVERSE ?" title="Une plateforme pensée pour les enfants d'Afrique" id="titre-avantages" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ADVANTAGES.map(({ icon: I, title, text }) => (
            <div key={title} className="rounded-3xl bg-white p-6 shadow-carte ring-1 ring-encre/5">
              <I className="size-8 text-orange-600" aria-hidden />
              <h3 className="mt-4 font-black">{title}</h3>
              <p className="mt-2 text-sm text-encre-doux">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
