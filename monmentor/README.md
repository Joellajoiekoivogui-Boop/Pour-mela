# MonMentor · version 2

Plateforme de mentorat qui met en relation les jeunes talents de Guinée et de la diaspora avec des professionnels vérifiés. Cette version reprend le prototype du hackathon « Talents connect » et corrige les points relevés lors de l'audit du 8 novembre 2026. Elle ajoute aussi les fonctionnalités prévues par les spécifications techniques.

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, base libSQL / SQLite avec Drizzle ORM.

## Démarrer

```bash
cd monmentor
npm install
cp .env.example .env        # puis ajuster les valeurs
npm run db:seed             # crée la base, les programmes et le jeu de démonstration
npm run dev                 # http://localhost:3000
```

Si `DEMO_MODE=true`, la page de connexion propose des comptes de démonstration (« Jury, visiteur ? »). Tous les comptes de démonstration sont fictifs et marqués comme tels. En production (`DEMO_MODE=false`), ils sont exclus de l'annuaire, des recommandations et des statistiques.

| Commande | Rôle |
| --- | --- |
| `npm run dev` / `npm run build` / `npm start` | Développement, compilation, production |
| `npm test` | Tests unitaires (recommandation, cycle des séances, partage, âge) |
| `npm run test:e2e` | 25 tests de bout en bout sur un serveur lancé (`BASE_URL`, mode démo) |
| `npm run db:migrate` | Applique les fichiers `drizzle/NNNN_*.sql` pas encore appliqués |
| `npm run db:seed` | Migrations, programmes et jeu de démonstration s'il est absent |
| `npm run demo:reset` | Efface et recrée les comptes de démonstration (à planifier chaque nuit) |
| `npm run jobs` | Tâche planifiée : clôture des séances et envoi des rappels |
| `npm run admin:create -- --email … --name … --password …` | Crée un compte de coordination |

## Ce qui change par rapport au prototype

### Corrections de l'audit (lot 0)

| Problème relevé | Correction |
| --- | --- |
| Pages de détail en erreur | Toutes les pages de détail sont couvertes par les tests de bout en bout ; une page d'erreur lisible remplace « Application error ». |
| Notes et chiffres fictifs présentés comme réels | Comptes `is_demo` exclus en production, badge « Démo » en mode démo ; une note n'est affichée qu'à partir de 3 avis. |
| Profil non vérifié visible | Annuaire, accueil et recommandation limités aux mentors vérifiés (niveau 2 ou plus). |
| Comptes de démo modifiables par tous | `npm run demo:reset` recrée la démo ; les boutons de démo n'existent qu'avec `DEMO_MODE=true`. |
| Séance passée encore « à venir » | Statut calculé à l'affichage, et transitions enregistrées par la tâche planifiée. |
| Lien 404 vers une page protégée | La page 404 renvoie vers `/` et vers l'annuaire. |
| Titre « votre entreprise » | « Un mentor pour vos ambitions », rendu côté serveur. |
| Sections vides avant défilement | Aucun contenu masqué en attente d'animation. |
| Pas d'aperçu au partage, pas de `robots.txt` | Open Graph partout, image générée, `robots.txt`, `sitemap.xml`, manifeste. |
| Cache d'un an, aucun en-tête de sécurité | Pages dynamiques ; CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`, `x-powered-by` retiré. |
| Annuaire caché derrière la connexion | Annuaire, fiches mentor, programmes et ressources consultables sans compte. |
| Aucune page légale | Charte, confidentialité, conditions, mentions légales, contact (les informations sur l'éditeur sont signalées « À compléter »). |

### Nouvelles fonctionnalités

- **Recommandation v2** (`src/lib/matching.ts`) : référentiel de compétences commun aux jeunes et aux mentors, score pondéré (compétences 40 %, domaine 20 %, places 15 %, format et langue 10 %, proximité 10 %, avis 5 %), raisons affichées, domaines modifiables avant relance. 30 besoins de référence testés : au moins 90 % de bons mentors dans le top 3. Avec `ANTHROPIC_API_KEY`, le besoin est d'abord analysé par Claude (`src/lib/need-analysis.ts`) ; sinon, ou en cas d'erreur, l'analyse se fait par mots-clés. Les poids se règlent sans redéployer via `MATCH_WEIGHTS`.
- **CV partageable** : CV rempli automatiquement (compétences validées par un mentor après 2 séances, recommandations approuvées par le jeune, objectifs, séances, certificats). Visibilité privé / avec le lien / public (jamais public avant 18 ans). Page publique avec QR code, PDF A4 de moins de 300 Ko, image d'aperçu 1200 × 630, boutons LinkedIn, Facebook, WhatsApp et partage natif du téléphone. Bouton « Ajouter à mon profil LinkedIn » pour les certificats, vérifiables sur `/verif/<code>`. Profil d'impact pour les mentors.
- **Confiance** : vérification des mentors en 3 niveaux, charte acceptée et horodatée, bouton « Signaler » sur profils, messages, séances et contenus, alerte immédiate pour harcèlement ou arnaque, suspension automatique à 3 signalements ouverts.
- **Mineurs** : accord parental par SMS, visio uniquement, mentors de niveau 3 seulement, messagerie fermée de 22 h à 6 h.
- **Séances** : demande sur les créneaux du mentor, validation, rappels la veille et une heure avant, visio Jitsi avec bouton « audio seul » et repli vers le chat, absence détectée après 15 minutes, compte rendu en 2 minutes dont les prochaines actions deviennent des étapes d'objectif, avis du jeune.
- **Rappels** : WhatsApp (API Cloud de Meta, modèle pré-approuvé), puis SMS en secours, ou e-mail ; plage silencieuse de 22 h à 7 h ; sans fournisseur configuré, les messages sont écrits dans le journal du serveur.
- **Connexion par téléphone** : code à 6 chiffres valable 10 minutes, 3 envois par heure, blocage de 15 minutes après 5 erreurs.
- **Mentorat de groupe** : 4 programmes de 6 à 8 semaines, cohortes de 5 à 10 jeunes avec liste d'attente, certificat délivré automatiquement à 75 % de présence avec le livrable validé.
- **Coordination** (`/admin`) : tableau d'impact (jumelages actifs, présence, objectifs atteints, délai du premier jumelage, rétention des mentors, partages de CV, envois), export CSV, file des vérifications, modération des signalements, certificats, journal des actions.
- **Opportunités** : alerte des jeunes intéressés par le domaine à chaque publication, sélection personnelle, compte à rebours.
- **Application installable** : manifeste, service worker (pages consultées disponibles hors connexion), page hors ligne.
- **Données personnelles** : export JSON et suppression du compte en libre-service.

## Mise en production

1. Créer une base [Turso](https://turso.tech) (libSQL) et renseigner `DATABASE_URL` (`libsql://…`) et `DATABASE_AUTH_TOKEN`. Une base SQLite locale (`file:…`) ne convient qu'à un serveur unique avec disque persistant.
2. Renseigner `NEXT_PUBLIC_SITE_URL`, `DEMO_MODE=false`, `CRON_SECRET` et `AUTH_SECRET` (chaînes aléatoires longues).
3. Lancer `npm run db:migrate`, puis `npm run admin:create`.
4. Planifier `GET /api/cron/jobs` toutes les 15 minutes avec l'en-tête `Authorization: Bearer <CRON_SECRET>`. Le fichier `vercel.json` le déclare pour Vercel ; l'offre gratuite de Vercel limite les tâches à une par jour, il faut alors un planificateur externe.
5. Configurer les envois : `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` et un modèle `monmentor_notification` approuvé par Meta (une variable de texte), `SMS_WEBHOOK_URL` vers votre fournisseur SMS (POST JSON `{ to, text }`), `EMAIL_WEBHOOK_URL` (POST JSON `{ to, subject, text }`).
6. Optionnel : `ANTHROPIC_API_KEY` pour l'analyse du besoin par IA, `VISIO_BASE_URL` pour une instance Jitsi auto-hébergée ou JaaS.
7. Compléter les passages « À compléter » des pages `/mentions-legales`, `/confidentialite` et `/contact`.

Sur Vercel, ce dossier se déploie comme un projet séparé, avec `monmentor` comme répertoire racine.

## Organisation du code

```
drizzle/              migrations SQL (alignées sur src/db/schema.ts)
scripts/              seed, migrations, tâches planifiées, création d'admin, tests e2e
src/db/               schéma et connexion
src/lib/              métier : recommandation, statuts de séance, notifications, CV, partage, impact
src/app/(public)/     vitrine, annuaire, programmes, CV public, pages légales, connexion
src/app/(app)/        espace connecté : accueil, séances, objectifs, messages, CV, coordination
src/app/actions/      actions serveur (formulaires)
src/app/api/          PDF, image d'aperçu, export, tâches planifiées
tests/                tests unitaires (Vitest)
```

## Limites connues

- La visio s'ouvre dans un nouvel onglet sur `meet.jit.si`. L'intégrer dans la page demande une instance Jitsi auto-hébergée ou JaaS.
- La messagerie se rafraîchit toutes les 10 secondes. Il n'y a pas de connexion en temps réel.
- Le mentorat de groupe n'a pas encore de discussion de groupe : les échanges passent par les séances.
- La saisie vocale du besoin et l'interface en langues nationales restent à faire.
