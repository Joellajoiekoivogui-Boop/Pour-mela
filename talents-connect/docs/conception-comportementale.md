# Conception comportementale de TALENTS CONNECT

Ce document applique cinq points de vue (recherche utilisateur, psychologie cognitive, psychologie sociale, design comportemental et design d'interface) aux deux publics de la plateforme : les **mentorés** (élèves, étudiants, jeunes diplômés) et les **mentors** (professionnels qui enseignent et transmettent).

> **Statut** : il s'agit d'hypothèses de conception fondées sur des résultats de recherche établis. **Aucun entretien ni test utilisateur n'a encore été mené.** La section 1 propose le protocole pour les valider avant et après le hackathon.

---

## 1. UX Researcher : comprendre les besoins

### Hypothèses de besoins à vérifier

| Public | Besoin supposé | Frein probable | Ce que la plateforme fait |
| --- | --- | --- | --- |
| Mentoré | Savoir **par où commencer** | Objectifs flous (« réussir dans l'informatique ») | Assistant d'orientation, objectifs découpés en étapes, « prochaine petite action » |
| Mentoré | Oser contacter un professionnel | Timidité, peur de déranger, statut social | Mentors vérifiés et volontaires, score expliqué, demande guidée (motivation + objectifs) |
| Mentoré | Avancer entre deux séances | Oubli, perte d'élan, connexion intermittente | Intentions « Quand…, je… », révision espacée, interface légère |
| Mentor | Aider **sans y passer trop de temps** | Agenda chargé, organisation lourde | Créneaux publiés en une fois, réservation par le mentoré, capacité maximale |
| Mentor | Savoir si ses conseils servent | Pas de retour après la séance | « Ce que je retiens » du mentoré, progression visible des objectifs |

### Protocole de validation (à mener)

1. **Entretiens** (5 mentorés et 5 mentors, 30 minutes chacun). Questions ouvertes : « Racontez la dernière fois que vous avez cherché un conseil professionnel », « Qu'est-ce qui vous a empêché d'avancer ? »
2. **Test du parcours MVP** sur smartphone Android avec 5 jeunes : inscription → profil → demande → réservation → objectif. On mesure le taux de réussite par tâche, le temps passé et les hésitations.
3. **Indicateurs après le lancement** :
   - part des profils complets ;
   - délai de réponse aux demandes ;
   - part des séances suivies d'un « Ce que je retiens » ;
   - étapes accomplies par mentoré et par mois ;
   - mentorats actifs à 60 jours (rétention).

---

## 2. Psychologue cognitif : mémoire et apprentissage

| Résultat de recherche | Application dans TALENTS CONNECT |
| --- | --- |
| **Effet de génération** : on retient mieux ce que l'on formule soi-même que ce que l'on relit. | Après chaque séance réalisée, le mentoré écrit « Ce que je retiens » (1 à 3 idées) avec ses mots. |
| **Pratique de récupération** : essayer de se souvenir consolide plus que relire. | La carte « Petite révision » demande d'abord de se rappeler, **puis** affiche les notes. |
| **Effet d'espacement** : des révisions réparties dans le temps battent une révision massée. | Première révision à J+2, puis tous les 7 jours, 4 fois au plus (`src/lib/learning.ts`). |
| **Charge cognitive** : la mémoire de travail est limitée. | Une seule « prochaine petite action » à la fois sur le tableau de bord ; objectifs découpés en étapes courtes. |
| **Retour rapide et précis** : il guide l'apprentissage mieux qu'une note globale. | Message à chaque étape validée ; consigne au mentor : « un point fort précis, puis une piste concrète ». |

---

## 3. Psychologue social : motivation et interactions

S'appuie sur la **théorie de l'autodétermination**, qui nomme trois besoins : autonomie, compétence et appartenance.

- **Autonomie** : le mentoré choisit son mentor, ses objectifs et son rythme. L'IA et le matching *proposent* et ne décident jamais. Il n'y a ni obligation de connexion quotidienne ni série (« streak ») culpabilisante.
- **Compétence** : la progression est calculée sur les étapes **réellement accomplies** et non sur le temps passé. Les messages de réussite nomment le progrès (« première étape franchie », « la moitié du chemin »).
- **Appartenance** : la relation passe par une personne vérifiée et non par un fil anonyme. Le mentor est prévenu quand le mentoré note ce qu'il retient, ce qui entretient la réciprocité.
- **Pas de comparaison sociale publique** : aucun classement entre mentorés. Le classement favorise ceux qui sont déjà en avance et décourage les autres, notamment ceux qui ont le moins de soutien.
- **Engagement** : écrire sa motivation dans la demande, et son intention sur une étape, rend l'engagement explicite. L'effet de cohérence aide à le tenir.

---

## 4. Behavioral Designer : des connaissances aux mécanismes

| Mécanisme | Déclencheur | Action attendue | Fichiers |
| --- | --- | --- | --- |
| **Intention de mise en œuvre** (« Quand [situation], je [action] ») | La prochaine étape d'un objectif | Fixer un moment précis | `goal-detail.tsx`, colonne `goal_milestones.intention` |
| **Prochaine petite action** | Arrivée sur le tableau de bord | Ouvrir l'étape et la planifier | `app/mentore/page.tsx`, `nextAction()` |
| **Ce que je retiens** | Séance marquée « réalisée » par le mentor | Écrire 1 à 3 idées | `appointment-item.tsx`, fonction SQL `save_session_takeaways` |
| **Révision espacée** | 2 jours après la note, puis tous les 7 jours | Se rappeler, puis comparer | `review-card.tsx`, `isReviewDue()` |
| **Progression dotée au départ** | Profil incomplet | Compléter les 6 éléments utiles au matching | `profileChecklist()` |
| **Retour encourageant** | Étape cochée | Continuer | `milestoneFeedback()` |

Les garde-fous éthiques se cumulent :

- aucune mécanique de jeu d'argent (récompenses aléatoires) ;
- aucune perte ni pénalité ;
- aucune notification répétée pour forcer le retour ;
- au plus 4 révisions par séance ;
- tout est facultatif.

---

## 5. UI/UX Designer : interfaces et interactions

- **Hiérarchie** : la carte « prochaine petite action » est la première chose visible du tableau de bord. Les statistiques passent après.
- **Formulaires guidés** : l'intention se saisit en deux champs, « Quand… » et « je… », au lieu d'un texte libre intimidant. Les exemples sont pré-remplis en grisé.
- **Divulgation progressive** : les notes de révision restent cachées tant que le mentoré n'a pas essayé de se souvenir. Le détail du score se replie.
- **Mobile d'abord** : les cibles tactiles mesurent au moins 32 px. Aucun défilement horizontal (vérifié à 390 px). Les textes sont courts.
- **Accessibilité** : barres de progression étiquetées, contrastes de la charte, focus visible, mouvements réduits respectés.
- **Ton** : tutoiement évité, encouragements sobres, aucune promesse.

---

## Prochaines étapes proposées

1. Mener les 10 entretiens et le test du parcours (section 1) et corriger ces hypothèses.
2. Proposer au mentor un **modèle de séance** (objectif de la séance, exercice, prochaine action) préparé avec l'assistant.
3. Envoyer le rappel de révision par e-mail ou SMS, après accord, pour les mentorés peu connectés.
4. Mesurer l'effet des intentions : comparer le taux d'étapes accomplies avec et sans intention.
