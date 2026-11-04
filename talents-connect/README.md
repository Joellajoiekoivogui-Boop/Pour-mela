# TALENTS CONNECT

> Connecter les talents, transmettre les expériences, construire les carrières de demain.

TALENTS CONNECT est une plateforme de mentorat numérique pour les jeunes de Guinée. Elle a été développée pour le programme de mentorat et le hackathon d'innovation numérique du Salon international du livre de jeunesse de Conakry (10ᵉ édition). Elle met en relation des jeunes (« mentorés ») avec des professionnels vérifiés (« mentors »), puis outille tout le suivi : séances, messagerie, objectifs et progression.

## Sommaire

1. [Fonctionnalités](#fonctionnalités)
2. [Stack et choix techniques](#stack-et-choix-techniques)
3. [Installation locale](#installation-locale)
4. [Configurer Supabase](#configurer-supabase)
5. [Créer le premier administrateur](#créer-le-premier-administrateur)
6. [Comptes de démonstration](#comptes-de-démonstration)
7. [Activer l'IA (facultatif)](#activer-lia-facultatif)
8. [Déployer sur Vercel](#déployer-sur-vercel)
9. [Base de données](#base-de-données)
10. [Sécurité](#sécurité)
11. [Tests](#tests)
12. [Structure du projet](#structure-du-projet)
13. [Limites connues et suites](#limites-connues-et-suites)

## Fonctionnalités

| Espace | Ce qui fonctionne |
| --- | --- |
| **Public** | Accueil (hero, fonctionnement, domaines, avantages, mentors, statistiques **réelles**, témoignages **marqués « exemple illustratif »**, FAQ), À propos, Comment ça marche, annuaire des mentors filtrable, profil public, domaines, Devenir mentor, conditions, confidentialité |
| **Authentification** | Inscription avec choix « Je souhaite être accompagné » / « Je souhaite devenir mentor », confirmation d'e-mail, connexion, déconnexion, mot de passe oublié, redirection selon le rôle, compte suspendu |
| **Mentoré** | Tableau de bord, profil complet (photo, formation, compétences, domaines, objectifs), **matching explicable**, fiche mentor et demande, mes demandes, mentorats et espace de suivi, réservation, annulation et reprogrammation de séances, calendrier mois/semaine, messagerie temps réel avec pièces jointes, objectifs et étapes, graphiques de progression, bibliothèque, opportunités et favoris, évaluation du mentor, signalement, notifications, assistant IA, paramètres |
| **Mentor** | Tableau de bord, profil professionnel (vérifié par l'admin), demandes (accepter / refuser), mentorés et suivi, objectifs co-construits et commentaires, publication de créneaux (répétition hebdomadaire), confirmation, séance réalisée et notes, messagerie, ressources (lien, vidéo, PDF, image), évaluations reçues, assistant de préparation de séance |
| **Administration** | Vue générale (10 indicateurs), utilisateurs (recherche, filtres, pagination, suspension, rôles), administrateurs, vérification des mentors, demandes, mentorats, rendez-vous, évaluations (masquer), signalements, opportunités (création, édition, suppression), ressources, journal d'activité, état de la configuration |

### Le parcours du MVP (démo jury)

1. Inscription d'un mentoré, puis d'un mentor.
2. Chacun complète son profil.
3. L'admin vérifie le mentor (`/admin/mentors`).
4. Le mentoré consulte les mentors et voit son **score de compatibilité détaillé** (`/mentore/trouver`).
5. Il envoie une demande ; le mentor la reçoit (notification) et l'accepte.
6. Le mentorat et sa conversation privée sont créés automatiquement.
7. Le mentor publie des créneaux ; le mentoré réserve ; le mentor confirme.
8. Le mentoré définit un objectif et ses étapes (ou le génère avec l'assistant), puis coche ses étapes : la progression se calcule sur les étapes réellement accomplies.
9. L'admin suit le tout dans `/admin`.

## Stack et choix techniques

- **Next.js 16 (App Router)**, React 19, TypeScript strict (`noUncheckedIndexedAccess` activé), Tailwind CSS 4.
- **Composants UI au style shadcn/ui**, écrits dans `src/components/ui`. Ils utilisent `class-variance-authority` et `tailwind-merge`, sans Radix : cela fait moins de dépendances et des contrôles natifs accessibles. Icônes : Lucide.
- **Formulaires** : React Hook Form et Zod. Les **mêmes schémas** (`src/lib/validation/schemas.ts`) sont revérifiés dans chaque action serveur.
- **Supabase** : Auth, PostgreSQL, Storage (avatars, ressources, pièces jointes), Realtime (messages, notifications) et **RLS sur toutes les tables**.
- **Recharts** pour les graphiques, **date-fns + @date-fns/tz** pour les dates (fuseau `Africa/Conakry`), **sonner** pour les notifications toast.

Décisions importantes :

- **La sécurité est dans la base, pas dans l'interface.** Les transitions sensibles passent par des fonctions SQL `SECURITY DEFINER` : accepter une demande, réserver un créneau, vérifier un mentor, attribuer un rôle. Chacune vérifie `auth.uid()`. Les tables concernées n'ont aucune politique d'écriture directe.
- **Le rôle ne vient jamais du navigateur.** À l'inscription, le choix mentor/mentoré n'est qu'une préférence. Un déclencheur l'accepte seulement s'il vaut `mentor`, sinon il attribue `mentee`. Un autre déclencheur interdit à un utilisateur de modifier son rôle ou sa vérification.
- **Le matching n'est pas de l'IA.** C'est un algorithme déterministe, testé, dont chaque point est justifié (`src/lib/matching/engine.ts`). Il fonctionne sans clé d'API.
- **L'IA est facultative et interchangeable.** Les appels se font côté serveur : Anthropic, ou toute API compatible OpenAI. Une limite quotidienne est stockée en base. Un mode sans IA à base de modèles prédéfinis prend le relais, et l'interface le signale toujours.
- **Les server actions sont préférées aux routes API.** Elles servent aux mutations ; la seule route API est celle de l'assistant (`/api/assistant`).

## Installation locale

Prérequis : Node.js 20 ou plus et un projet Supabase gratuit sur [supabase.com](https://supabase.com).

```bash
cd talents-connect
npm install
cp .env.example .env.local   # puis renseigner les valeurs (voir ci-dessous)
npm run dev                  # http://localhost:3000
```

Variables d'environnement (`.env.example`) :

| Variable | Obligatoire | Rôle |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | oui | URL du projet (Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | oui | Clé publique `anon` |
| `NEXT_PUBLIC_SITE_URL` | recommandé | Adresse du site, pour les liens des e-mails |
| `SUPABASE_SERVICE_ROLE_KEY` | non | **Uniquement** pour `npm run seed:demo` ; jamais utilisée par l'application |
| `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL`, `AI_DAILY_LIMIT` | non | Assistant IA (voir plus bas) |

Sans Supabase, le site public s'affiche, mais l'authentification et les données sont indisponibles. Les pages le signalent clairement.

## Configurer Supabase

1. **Migrations** : dans *SQL Editor*, exécutez dans l'ordre :
   1. `supabase/migrations/20261104000000_schema.sql` (tables, types, index)
   2. `supabase/migrations/20261104000100_functions.sql` (fonctions métier, déclencheurs, notifications)
   3. `supabase/migrations/20261104000200_rls.sql` (RLS, buckets Storage, Realtime)
   4. `supabase/seed.sql` (12 domaines d'expertise, environ 50 compétences : données de référence, pas de démo)

   Avec la CLI Supabase : `supabase link --project-ref <ref>`, puis `supabase db push`, puis `psql "<db-url>" -f supabase/seed.sql`.
2. **Authentication → URL Configuration** :
   - *Site URL* : `http://localhost:3000` en local, l'URL Vercel en production.
   - *Redirect URLs* : ajoutez `http://localhost:3000/auth/confirm` et `https://<votre-domaine>/auth/confirm`.
3. **Authentication → Providers → Email** : laissez *Confirm email* activé en production. Pour une démo rapide, vous pouvez le désactiver : l'inscription ouvre alors directement la session.
4. **E-mails** : l'envoi intégré de Supabase est limité à quelques e-mails par heure. Pour un vrai lancement, configurez un SMTP dans *Authentication → SMTP Settings*.
5. **Realtime** : la migration ajoute `messages` et `notifications` à la publication `supabase_realtime`. Vérifiez-le dans *Database → Publications*.
6. **Rappels de séance** (facultatif) : activez l'extension `pg_cron`, puis :
   ```sql
   select cron.schedule('rappels-seances', '*/15 * * * *', 'select public.send_session_reminders()');
   ```

## Créer le premier administrateur

Les rôles `admin` et `super_admin` **ne s'obtiennent jamais à l'inscription**. Pour créer le premier :

1. Inscrivez-vous normalement sur le site avec l'adresse de l'administrateur.
2. Dans le *SQL Editor* de Supabase, qui s'exécute en session serveur de confiance, lancez :
   ```sql
   update public.profiles set role = 'super_admin'
   where id = (select id from auth.users where email = 'admin@exemple.org');
   ```
3. Reconnectez-vous : vous arrivez sur `/admin`. Pour nommer d'autres administrateurs, passez ensuite par `/admin/utilisateurs`. Chaque changement est inscrit au journal.

## Comptes de démonstration

```bash
# dans .env.local : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
DEMO_PASSWORD='ChoisissezUnMotDePasse1' npm run seed:demo
```

Le script crée les comptes suivants, tous marqués `is_demo` (badge « démo » dans l'interface) et en `@demo.talents-connect.test` :

- **5 mentors vérifiés** (développement, CTO, marketing, cybersécurité, data), avec leurs créneaux pour les 4 prochains samedis. Exemple : `aminata.conde@demo.talents-connect.test`.
- **1 mentorée** au profil rempli : `awa.camara@demo.talents-connect.test`.
- **1 super administrateur** : `admin@demo.talents-connect.test`.
- 2 opportunités et 2 ressources d'exemple, intitulées « (démo) ». **Aucune vraie offre n'est inventée.**

Le mot de passe est celui de `DEMO_PASSWORD`. Le script peut être relancé sans créer de doublons. Supprimez ces comptes avant un lancement public.

## Activer l'IA (facultatif)

```bash
AI_PROVIDER=anthropic
AI_API_KEY=<votre clé>
AI_MODEL=claude-opus-5-5        # ou un modèle moins coûteux
AI_DAILY_LIMIT=30               # requêtes par utilisateur et par 24 h
```

Pour toute API compatible OpenAI (OpenAI, Mistral, Groq, OpenRouter, Ollama…) : `AI_PROVIDER=openai`, `AI_BASE_URL=https://…/v1` et `AI_MODEL=…`.

La clé ne quitte jamais le serveur (`src/lib/ai/provider.ts`). Le modèle reçoit le contexte du profil (formation, domaines, objectifs), **jamais le nom ni l'e-mail**. Le prompt système lui interdit d'inventer offres, expériences ou qualifications. En cas d'erreur, de dépassement de délai, de quota atteint ou d'absence de clé, l'assistant répond avec un modèle prédéfini, signalé « Modèle prédéfini (sans IA) ».

## Déployer sur Vercel

1. *Add New Project* → importez ce dépôt.
2. **Root Directory : `talents-connect`**. Le dépôt contient d'autres sites : ce réglage est indispensable.
3. Framework : Next.js (détecté). Ajoutez les variables d'environnement ci-dessus (pas la clé `service_role`).
4. Déployez, puis ajoutez l'URL de production dans les *Redirect URLs* Supabase et dans `NEXT_PUBLIC_SITE_URL`.

`vercel.json` ne reconstruit le projet que si le dossier `talents-connect/` a changé.

## Base de données

Tables principales (toutes avec RLS) :

- **Comptes** : `profiles` (rôle, suspension, démo), `mentor_profiles` (parcours, vérification, capacité), `mentee_profiles`.
- **Référentiels** : `expertise_domains`, `skills`, `user_skills` (`has` / `wants` / `teaches`), `user_domains`.
- **Mentorat** : `mentor_requests` (une seule demande en attente par couple) → `mentorships` (créé par `respond_to_request`).
- **Objectifs** : `mentorship_goals`, `goal_milestones` (le statut de l'objectif est recalculé automatiquement depuis les étapes), `goal_comments`.
- **Séances** : `availability_slots` (UTC, `timestamptz`), `appointments` (gérés uniquement par les fonctions `book_`, `confirm_`, `cancel_`, `reschedule_` et `complete_appointment`).
- **Messagerie** : `conversations`, `conversation_members`, `messages`.
- **Contenus** : `resources`, `opportunities`, `opportunity_bookmarks`, `reviews`.
- **Système** : `notifications` (écrites par déclencheurs uniquement), `reports`, `admin_activity_logs`, `ai_usage`.

Cycle de vie d'une demande : `pending` → `accepted` (le mentorat est « en cours ») → `completed`, ou bien `refused` / `cancelled`. Le statut « en cours » est porté par `mentorships.status = active`.

Les types TypeScript (`src/types/db.ts`) sont écrits à la main. Vous pouvez les régénérer avec `npx supabase gen types typescript`.

## Sécurité

- RLS sur les 25 tables, et politiques Storage par dossier (`<user_id>/` pour les avatars et ressources, `<conversation_id>/` pour les pièces jointes, bucket privé et liens signés de 10 minutes).
- Les conversations sont lisibles **par les deux participants seulement**, pas par l'administration.
- Le profil d'un mentoré n'est visible que des mentors qu'il a sollicités.
- `getUser()` (jeton vérifié) est utilisé à la place de `getSession()` côté serveur. Le proxy Next.js protège `/espace`, `/mentore`, `/mentor` et `/admin`, et chaque layout revérifie le rôle en base.
- Redirections limitées aux chemins internes ; aucun HTML injecté (les liens des messages sont rendus en éléments React) ; en-têtes `X-Frame-Options`, `nosniff`, `Referrer-Policy` et `Permissions-Policy`.
- Les erreurs SQL inattendues sont masquées : seuls les messages métier en français sont affichés.

## Tests

```bash
npm run typecheck   # TypeScript strict
npm run lint        # ESLint (règles Next.js et React 19)
npm test            # 14 tests unitaires : matching, progression, fuseau horaire, redirections, mode sans IA
npm run test:db     # migrations + 14 scénarios de sécurité sur un PostgreSQL local
npm run build
BASE_URL=http://localhost:3000 npm run test:smoke   # Chromium : pages, routes protégées, liens, mobile 390 px
```

`npm run test:db` simule le strict nécessaire de Supabase (`supabase/tests/00_supabase_stub.sql`). Il rejoue ensuite tout le parcours MVP en tant que vrais utilisateurs, chacun avec le rôle `authenticated` et son JWT : inscription, rôle forcé, vérification, demande, acceptation, objectif, réservation, message, confirmation, annulation, avis, administration, accès anonyme, isolation d'un tiers et suppression de compte. Il faut `psql`, `createdb` et un serveur PostgreSQL 15 ou plus.

## Structure du projet

```
talents-connect/
├── supabase/
│   ├── migrations/     # schéma, fonctions métier, RLS
│   ├── seed.sql        # domaines et compétences
│   └── tests/          # simulation Supabase + tests RLS
├── scripts/            # seed-demo.mjs, smoke.cjs
└── src/
    ├── app/
    │   ├── (public)/   # site vitrine
    │   ├── (auth)/     # connexion, inscription, mot de passe
    │   ├── mentore/    # espace mentoré
    │   ├── mentor/     # espace mentor
    │   ├── admin/      # administration
    │   ├── api/assistant/
    │   └── auth/confirm/
    ├── components/     # ui/, layout/, forms/, shared/, mentorship/, goals/, messages/, admin/…
    ├── content/        # textes éditoriaux du site public
    ├── lib/
    │   ├── actions/    # server actions (une par domaine métier)
    │   ├── ai/         # fournisseur, prompts, mode sans IA
    │   ├── matching/   # moteur de recommandation
    │   ├── supabase/   # clients navigateur / serveur
    │   └── validation/ # schémas Zod partagés
    ├── proxy.ts        # rafraîchissement de session + protection des routes
    └── types/db.ts
```

## Limites connues et suites

- **Notifications par e-mail** : seuls les e-mails d'authentification (Supabase Auth) partent aujourd'hui. Les notifications applicatives sont dans l'application et en temps réel. Pour les envoyer aussi par e-mail, branchez un *Database Webhook* Supabase sur `notifications` (INSERT) vers une Edge Function qui appelle votre service (Resend, Brevo…).
- **Google Calendar / visioconférence** : le mentor saisit le lien de visio à la confirmation. Les rendez-vous ont des horaires UTC et des types de séance normalisés, ce qui prépare une future synchronisation.
- **Fuseau horaire** : l'affichage se fait à l'heure de Conakry. Une préférence de fuseau par utilisateur est la prochaine étape pour l'usage panafricain (`src/lib/dates.ts` accepte déjà un fuseau en paramètre).
- **Pas de test de bout en bout contre un vrai projet Supabase dans ce dépôt** : la RLS et les fonctions sont testées sur PostgreSQL, l'interface avec Chromium. Faites le parcours MVP ci-dessus sur votre projet avant la démo.
- Les pages légales sont des **documents de travail** à faire valider avant un lancement public.
