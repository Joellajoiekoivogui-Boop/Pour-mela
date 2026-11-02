# CONTEVERSE

> **Découvre l'Afrique, comprends le monde, imagine demain.**
> Hackathon Lire Demain 2026 — Guinée

CONTEVERSE est une encyclopédie éducative interactive pour les enfants de 7 à 12 ans. Elle donne le goût de la lecture en faisant découvrir la Guinée, puis toute l'Afrique : histoire, cultures, langues, géographie, sciences, nature, arts et avenir.

Le MVP fonctionne **sans aucune configuration** (mode démonstration). Supabase (comptes, synchronisation, administration) et l'IA de LUMO s'activent avec des variables d'environnement.

---

## Sommaire

1. [Ce qui est livré](#ce-qui-est-livré)
2. [Démarrage rapide](#démarrage-rapide)
3. [Parcours de démonstration pour le jury](#parcours-de-démonstration-pour-le-jury)
4. [Variables d'environnement](#variables-denvironnement)
5. [Connexion à Supabase](#connexion-à-supabase)
6. [Assistant LUMO (IA)](#assistant-lumo-ia)
7. [Déploiement sur Vercel](#déploiement-sur-vercel)
8. [Architecture](#architecture)
9. [Fiabilité des contenus](#fiabilité-des-contenus)
10. [Connexion limitée et PWA](#connexion-limitée-et-pwa)
11. [Sécurité et données des enfants](#sécurité-et-données-des-enfants)
12. [Tests](#tests)
13. [Ajouter du contenu](#ajouter-du-contenu)
14. [Feuille de route](#feuille-de-route)

---

## Ce qui est livré

| Espace | URL | Contenu |
|---|---|---|
| Accueil | `/` | Hero et slogan, Guinée, pays, 12 univers, histoires, jeux, LUMO, avantages |
| Mon espace | `/dashboard` | Profil (pseudonyme et avatar), niveau, XP, badges, défi du jour, pays explorés, dernières lectures, recommandations |
| Africa Explorer | `/explorer`, `/explorer/[code]` | Carte Leaflet des 54 pays, fiches complètes pour la Guinée, le Sénégal, la Côte d'Ivoire, le Mali et le Ghana |
| Espace Guinée | `/guinee` | 4 régions naturelles, 8 villes-régions, frise historique, communautés, langues, nature, arts et économie |
| Univers | `/univers`, `/univers/[slug]` | 12 catégories illustrées |
| Bibliothèque | `/bibliotheque`, `/bibliotheque/[slug]` | 26 articles sourcés, filtres (catégorie, pays, niveau, âge, durée, type), glossaire interactif, écoute, lecture hors ligne, quiz, recommandations |
| StoryVerse | `/histoires`, `/histoires/[slug]` | 4 histoires originales (conte, épopée, fictions), dont 3 interactives à choix, lecture audio, quiz |
| LUMO | `/assistant` | Assistant éducatif avec garde-fous ; mode démo ou IA (Claude) |
| Africa Challenge | `/challenges`, `/challenges/[slug]` | 12 défis et 49 questions (pays, drapeaux, histoire, géographie, culture, personnalités, sciences, langues), défi du jour |
| Passeport africain | `/passeport` | Tampons de pays, 10 badges, articles, histoires et quiz, niveaux |
| Parents et enseignants | `/parents` | Temps de lecture sur 7 jours, thèmes, résultats aux quiz, export et réinitialisation des données |
| Administration | `/admin` | Protégée par rôle : articles (statut de publication), relectures, utilisateurs et rôles, journal de modération |
| Charte et sources | `/a-propos` | Règles éditoriales, contenus à valider, liste des sources |

**Gamification.** 5 niveaux (Petit curieux → Gardien du patrimoine), XP et 10 badges. Les XP récompensent la compréhension : relire un article ou rejouer un quiz ne rapporte rien de plus, seul le meilleur score compte. Il n'y a pas de série de jours à entretenir, et une pause est suggérée après 30 minutes de lecture dans la journée.

---

## Démarrage rapide

Prérequis : Node.js 20.9 ou plus récent (22 recommandé).

```bash
cd conteverse
npm install
npm run dev          # http://localhost:3000
```

Production locale :

```bash
npm run build
npm start
```

Sans fichier `.env.local`, l'application tourne en **mode démonstration** : la progression est enregistrée dans le navigateur et LUMO répond avec des réponses vérifiées prédéfinies. Ce mode est signalé dans l'interface.

---

## Parcours de démonstration pour le jury

1. Ouvrir l'**accueil** (`/`).
2. Cliquer sur **« Explorer l'Afrique »**.
3. Cliquer sur la **Guinée** sur la carte. La fiche s'ouvre et le badge **« Petit explorateur »** s'affiche.
4. Lire les blocs **Histoire**, **Indépendance** et **Cultures**.
5. Ouvrir l'article **« 1958 : le "non" qui fit naître la Guinée indépendante »**, cliquer sur un mot surligné, essayer « Écouter l'article ».
6. Cliquer sur **« J'ai fini de lire »** et répondre au **quiz**.
7. Le badge **« Premier quiz réussi »** apparaît.
8. Aller sur **LUMO** et poser une question, par exemple « Qu'est-ce que le Fouta-Djalon ? ».
9. Bonus : **Mon passeport** (`/passeport`) et l'**espace parents** (`/parents`).

Ce parcours est automatisé dans `scripts/e2e-jury.cjs` (voir [Tests](#tests)).

---

## Variables d'environnement

Copier `.env.example` en `.env.local` :

| Variable | Côté | Rôle |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Clé « anon » (publique par conception ; la sécurité repose sur RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **serveur uniquement** | Réservée à de futurs scripts d'administration ; jamais utilisée par le navigateur |
| `ANTHROPIC_API_KEY` | **serveur uniquement** | Active LUMO en mode IA (lue seulement par `/api/lumo`) |
| `LUMO_MODEL` | serveur | Modèle Claude de LUMO (défaut : `claude-opus-5-5`) |
| `NEXT_PUBLIC_SITE_URL` | public | URL publique (métadonnées) |

Aucune clé n'est écrite dans le code. Les variables sans préfixe `NEXT_PUBLIC_` ne sont jamais envoyées au navigateur.

---

## Connexion à Supabase

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Appliquer les migrations, dans l'ordre :
   - `supabase/migrations/20261102000000_schema.sql` : tables, contraintes, triggers ;
   - `supabase/migrations/20261102000100_rls.sql` : politiques RLS et bucket de stockage `media`.

   Avec la CLI Supabase :
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push
   ```
   Sans la CLI : copier le contenu de chaque fichier dans **SQL Editor** et l'exécuter.
3. Importer le contenu : `npm run seed` régénère `supabase/seed.sql` à partir de `src/data`, puis exécuter ce fichier dans le SQL Editor. Avec `supabase db reset` en local, il est chargé automatiquement.
4. Dans **Authentication → URL Configuration**, ajouter `https://<votre-domaine>/auth/callback` aux URL de redirection.
5. Renseigner `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`, puis redémarrer.
6. Créer le premier administrateur. S'inscrire via `/connexion`, puis dans le SQL Editor :
   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'vous@exemple.org';
   ```

**Ce qui change une fois connecté :**

- Un adulte responsable crée le compte (`/connexion`), puis l'enfant ne choisit qu'un pseudonyme et un avatar.
- La progression locale est fusionnée avec celle du compte à la connexion (`mergeProgress`), puis synchronisée à chaque action (`src/lib/progress/sync.ts`).
- `/admin` devient accessible aux rôles `admin` et `editeur`.
- Un lien parent ou enseignant ↔ enfant (`parental_accounts`) est créé par un administrateur après vérification. Le responsable lit alors la progression de l'enfant, sans pouvoir la modifier.

### Schéma (résumé)

- **Utilisateurs** : `profiles`, `user_roles`, `parental_accounts`
- **Géographie** : `countries`, `regions`, `cities`, `languages`, `country_languages`
- **Contenus** : `categories`, `articles`, `article_sections`, `article_sources`, `stories`, `story_nodes`, `story_choices`, `personalities`, `historical_events`, `cultural_heritage`, `natural_sites`, `media_assets`, `sources`
- **Apprentissage** : `quizzes`, `quiz_questions`, `quiz_answers`, `user_progress`, `reading_history`, `achievements`, `user_achievements`, `country_discoveries`
- **Administration** : `content_reviews`, `moderation_logs`

Chaque table a un identifiant, `created_at` et `updated_at` (mis à jour par trigger), des clés étrangères et des contraintes `check`.

### Tester les migrations sur un PostgreSQL local

`supabase/tests/00_supabase_stub.sql` simule le strict nécessaire de Supabase (`auth.users`, `auth.uid()`, `storage`, rôles `anon` et `authenticated`). `supabase/tests/rls_test.sql` vérifie les politiques : anonyme, utilisateur, autre utilisateur, éditeur, administrateur, parent lié.

```bash
createdb cv_test
psql -d cv_test -f supabase/tests/00_supabase_stub.sql \
  -f supabase/migrations/20261102000000_schema.sql \
  -f supabase/migrations/20261102000100_rls.sql \
  -c "grant select, insert, update, delete on all tables in schema public to anon, authenticated;" \
  -f supabase/seed.sql
psql -d cv_test -f supabase/tests/rls_test.sql
```

---

## Assistant LUMO (IA)

- **Sans clé** : mode démonstration, signalé dans l'en-tête du chat. LUMO s'appuie sur des réponses vérifiées pour les questions fréquentes, sur le glossaire (« Que veut dire… ? ») et sur une recherche dans les articles. Sinon, il dit qu'il ne sait pas et n'invente rien.
- **Avec `ANTHROPIC_API_KEY`** : `/api/lumo` appelle Claude via le SDK officiel `@anthropic-ai/sdk`, côté serveur uniquement. Les extraits d'articles CONTEVERSE pertinents sont injectés dans le prompt (RAG simple). Le prompt système impose un langage adapté à l'âge (7-9 ou 10-12 ans), l'interdiction d'inventer, la distinction entre contes et faits, le respect des communautés et le refus des sujets inadaptés. Le fallback serveur de l'API est activé pour les refus. En cas d'erreur, LUMO bascule automatiquement sur le mode démo.

**Garde-fous** (`src/lib/ai/safety.ts`), appliqués avant tout appel au modèle :

- détection d'informations personnelles (téléphone, e-mail, adresse, mot de passe) : rien n'est envoyé au modèle et l'enfant reçoit un rappel ;
- sujets inadaptés : redirection vers un adulte de confiance ;
- signes de détresse : message bienveillant qui oriente vers un adulte ;
- longueur limitée (400 caractères), historique limité aux 6 derniers messages ;
- limitation de débit par adresse IP ;
- vérification légère de la réponse générée ;
- CONTEVERSE n'enregistre pas les conversations.

---

## Déploiement sur Vercel

1. Importer le dépôt sur [vercel.com/new](https://vercel.com/new).
2. **Root Directory** : `conteverse`. Le framework Next.js est détecté automatiquement.
3. Ajouter les variables d'environnement de la section précédente (Production et Preview).
4. Déployer. Mettre ensuite à jour `NEXT_PUBLIC_SITE_URL` et l'URL de redirection Supabase (`/auth/callback`).

`conteverse/vercel.json` ne relance un déploiement que si le dossier `conteverse/` a changé. Le reste du dépôt n'est pas concerné.

---

## Architecture

```
conteverse/
├── public/
│   ├── data/africa.geojson     # frontières (Natural Earth, ~180 Ko)
│   ├── icons/                  # icônes PWA (SVG + PNG)
│   └── sw.js                   # service worker (cache, hors ligne)
├── scripts/
│   ├── build-africa-geojson.mjs  # npm run geo
│   ├── build-icons.mjs           # npm run icons
│   ├── generate-seed.ts          # npm run seed → supabase/seed.sql
│   └── e2e-jury.cjs              # npm run test:e2e
├── src/
│   ├── app/                    # pages (App Router), API /api/lumo, /auth/callback
│   ├── components/             # layout, home, explorer, articles, stories, assistant, quiz, dashboard, passport, progress, ui
│   ├── data/                   # catalogue éditorial (source de vérité du MVP)
│   ├── hooks/
│   ├── lib/
│   │   ├── ai/                 # LUMO : garde-fous, connaissances, prompt, appel Claude
│   │   ├── progress/           # moteur XP, niveaux, badges, défi du jour, synchronisation
│   │   ├── supabase/           # clients navigateur et serveur
│   │   └── utils/
│   ├── types/
│   └── proxy.ts                # rafraîchissement de session Supabase (Next 16)
├── supabase/
│   ├── migrations/             # schéma + RLS
│   ├── seed.sql                # généré
│   └── tests/                  # tests RLS sur PostgreSQL local
└── .env.example
```

**Choix techniques :**

- **Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Lucide, Framer Motion.** Les 108 pages de contenu sont pré-rendues statiquement : rapides, et faciles à mettre en cache.
- **Catalogue en TypeScript (`src/data`) comme source de vérité du MVP.** Le contenu est disponible sans base de données et versionné avec le code. `npm run seed` le pousse dans Supabase, où le schéma est prêt pour une gestion éditoriale complète.
- **Carte Leaflet sans tuiles.** Seules les frontières sont chargées, sans fond de carte à télécharger. La carte reste utilisable avec une connexion faible, et une liste des pays la double pour la navigation au clavier.
- **Illustrations en SVG** (paysages, avatars d'enfants, mascotte LUMO, drapeaux) : quelques Ko, nettes à toutes les tailles, aucune image lourde.
- **Lecture audio** par la synthèse vocale du navigateur : aucun fichier à télécharger. Des fichiers audio compressés pourront être ajoutés via `media_assets`.
- **Polices auto-hébergées** (Nunito via `@fontsource-variable`), sans appel à un service externe.

---

## Fiabilité des contenus

Ces règles sont détaillées dans `/a-propos` :

- aucune date, personnalité, tradition ou citation inventée ; chaque article et chaque fiche indiquent leurs sources ;
- les contes et épopées sont **toujours** signalés (bandeau en tête d'histoire) et distingués des faits ;
- les incertitudes sont expliquées aux enfants (encadrés « Ce qu'on ne sait pas encore ») ;
- chaque contenu porte un statut **« sourcé »** ou **« à valider »**, avec une note visible ;
- les histoires de StoryVerse sont des **textes originaux** ; aucun conte protégé n'est reproduit.

**Éléments à faire valider avant une publication officielle** (marqués « à valider » dans l'interface) :

- vocabulaire et orthographe en pular, maninka et susu, et traduction de « Syli » : à valider par des locuteurs et des linguistes ;
- présentation des communautés guinéennes : relecture avec des représentants de chaque communauté et région ;
- statut des langues officielles au Mali depuis la Constitution de 2023 ;
- chiffres de population : estimations à actualiser ;
- palmarès sportifs : à mettre à jour après chaque CAN ;
- quelques références bibliographiques sont génériques (« référence à préciser ») et doivent être complétées par le comité pédagogique.

---

## Connexion limitée et PWA

- **Installable** : `manifest.webmanifest` avec icônes 192, 512 et maskable.
- **Service worker** (`public/sw.js`) : stratégie « réseau d'abord » pour les pages, avec repli sur le cache puis sur `/hors-ligne` ; « cache d'abord » pour les fichiers statiques et la carte.
- **« Lire hors connexion »** sur chaque article : la page est enregistrée dans un cache dédié et reste lisible sans réseau (vérifié en test).
- La progression est toujours enregistrée localement : aucune action de l'enfant n'est bloquée par le réseau.
- Une bannière discrète signale la perte de connexion.

---

## Sécurité et données des enfants

- **Données minimales** : pseudonyme (lettres uniquement, 20 caractères), avatar dessiné, tranche d'âge. Pas de nom réel, de date de naissance, de photo ni de localisation.
- Le compte est créé par un **adulte responsable**.
- **RLS partout** : chacun ne lit et n'écrit que sa propre progression ; un responsable lié peut seulement la lire ; seuls les administrateurs attribuent les rôles ; les contenus non publiés ne sont visibles que de l'équipe ; le journal de modération ne peut pas être modifié.
- Les actions d'administration revérifient le rôle côté serveur, et la base l'impose une seconde fois par RLS.
- En-têtes de sécurité (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`).
- Ni publicité ni traceur. L'espace parents permet d'exporter et d'effacer les données.

---

## Tests

```bash
npm run lint         # ESLint (règles Next.js et React)
npm run typecheck    # TypeScript strict
npm test             # 20 tests unitaires : progression, badges, LUMO, garde-fous, intégrité du contenu
npm run build        # build de production

# Parcours du jury dans un vrai navigateur (Playwright requis : npm i -D playwright && npx playwright install chromium)
npm run build && npm start &
BASE_URL=http://localhost:3000 npm run test:e2e
```

Le test E2E rejoue les 8 étapes du parcours du jury. Il vérifie aussi l'absence de débordement horizontal sur mobile (390 px) et les réponses HTTP de toutes les pages.

---

## Ajouter du contenu

- **Un pays** : ajouter une fiche dans `src/data/countries.ts` (type `CountrySheet`), étendre `CountryCode` dans `src/types/content.ts`, et ajouter son drapeau dans `src/data/africa.ts`. La carte le rend cliquable automatiquement.
- **Un article** : ajouter un objet `Article` dans `src/data/articles/` (avec sources, glossaire, quiz et statut). Les tests d'intégrité vérifient les liens et les quiz.
- **Une histoire** : ajouter un objet `Story` dans `src/data/stories.ts` (nœuds et choix). Les tests vérifient que chaque chemin mène à une fin.
- Puis `npm test` et `npm run seed` pour mettre la base à jour.

---

## Feuille de route

- Édition complète des contenus depuis `/admin` (formulaires d'articles, médias via Supabase Storage), puis lecture des contenus publiés depuis la base.
- Fiches des 49 autres pays, rédigées avec des spécialistes.
- Enregistrements audio par des conteurs et conteuses guinéens (droits cédés), et versions en langues nationales.
- Invitation parent ↔ enfant par code, gérée par les familles elles-mêmes.
- Tableau de bord de classe pour les enseignants.
- Limitation de débit partagée (Redis ou table Supabase) pour LUMO à grande échelle.
