-- ════════════════════════════════════════════════════════════════════════
-- TALENTS CONNECT — Données de référence (domaines d'expertise, compétences)
-- Ce ne sont pas des données de démonstration : ces listes servent au profil
-- et au moteur de matching. Ré-exécutable sans doublon.
-- Les comptes de démonstration sont créés par « npm run seed:demo ».
-- ════════════════════════════════════════════════════════════════════════

insert into public.expertise_domains (slug, name, description, icon, sort_order) values
  ('developpement-informatique', 'Développement informatique', 'Web, mobile, logiciel, bases de données et bonnes pratiques de code.', 'code', 1),
  ('intelligence-artificielle', 'Intelligence artificielle', 'Données, apprentissage automatique, modèles de langage et IA appliquée.', 'brain-circuit', 2),
  ('cybersecurite', 'Cybersécurité', 'Sécurité des systèmes, des réseaux et des applications.', 'shield-check', 3),
  ('entrepreneuriat', 'Entrepreneuriat', 'Créer, financer et faire grandir une entreprise ou une startup.', 'rocket', 4),
  ('marketing-digital', 'Marketing digital', 'Réseaux sociaux, contenu, référencement et acquisition.', 'megaphone', 5),
  ('leadership', 'Leadership', 'Prise de parole, management d''équipe et développement personnel.', 'users', 6),
  ('gestion-de-projets', 'Gestion de projets', 'Planifier, piloter et livrer des projets, méthodes agiles.', 'kanban', 7),
  ('orientation-professionnelle', 'Orientation professionnelle', 'Choix d''études, CV, candidatures et entretiens.', 'compass', 8),
  ('culture-litterature', 'Culture et littérature', 'Écriture, édition, lecture et métiers du livre.', 'book-open', 9),
  ('design-creativite', 'Design et créativité', 'Design graphique, UX/UI, image et vidéo.', 'palette', 10),
  ('finance-gestion', 'Finance et gestion', 'Comptabilité, finance d''entreprise et gestion.', 'wallet', 11),
  ('agriculture-environnement', 'Agriculture et environnement', 'Agritech, énergies renouvelables et développement durable.', 'sprout', 12)
on conflict (slug) do update set name = excluded.name, description = excluded.description,
  icon = excluded.icon, sort_order = excluded.sort_order;

insert into public.skills (slug, name, domain_id)
select s.slug, s.name, d.id
from (values
  ('html-css', 'HTML et CSS', 'developpement-informatique'),
  ('javascript', 'JavaScript', 'developpement-informatique'),
  ('typescript', 'TypeScript', 'developpement-informatique'),
  ('react', 'React', 'developpement-informatique'),
  ('nextjs', 'Next.js', 'developpement-informatique'),
  ('nodejs', 'Node.js', 'developpement-informatique'),
  ('python', 'Python', 'developpement-informatique'),
  ('php', 'PHP', 'developpement-informatique'),
  ('java', 'Java', 'developpement-informatique'),
  ('sql', 'SQL et bases de données', 'developpement-informatique'),
  ('developpement-mobile', 'Développement mobile', 'developpement-informatique'),
  ('git', 'Git et GitHub', 'developpement-informatique'),
  ('architecture-logicielle', 'Architecture logicielle', 'developpement-informatique'),
  ('devops', 'DevOps et cloud', 'developpement-informatique'),
  ('machine-learning', 'Machine learning', 'intelligence-artificielle'),
  ('data-analyse', 'Analyse de données', 'intelligence-artificielle'),
  ('ia-generative', 'IA générative et prompts', 'intelligence-artificielle'),
  ('statistiques', 'Statistiques', 'intelligence-artificielle'),
  ('securite-reseaux', 'Sécurité des réseaux', 'cybersecurite'),
  ('securite-applicative', 'Sécurité applicative', 'cybersecurite'),
  ('tests-intrusion', 'Tests d''intrusion', 'cybersecurite'),
  ('reseaux-systemes', 'Réseaux et systèmes', 'cybersecurite'),
  ('business-plan', 'Business plan', 'entrepreneuriat'),
  ('levee-de-fonds', 'Recherche de financement', 'entrepreneuriat'),
  ('pitch', 'Pitch et présentation', 'entrepreneuriat'),
  ('modele-economique', 'Modèle économique', 'entrepreneuriat'),
  ('reseaux-sociaux', 'Réseaux sociaux', 'marketing-digital'),
  ('seo', 'Référencement (SEO)', 'marketing-digital'),
  ('creation-contenu', 'Création de contenu', 'marketing-digital'),
  ('publicite-en-ligne', 'Publicité en ligne', 'marketing-digital'),
  ('prise-de-parole', 'Prise de parole en public', 'leadership'),
  ('management-equipe', 'Management d''équipe', 'leadership'),
  ('communication', 'Communication professionnelle', 'leadership'),
  ('gestion-du-temps', 'Gestion du temps', 'leadership'),
  ('methodes-agiles', 'Méthodes agiles (Scrum)', 'gestion-de-projets'),
  ('planification', 'Planification de projet', 'gestion-de-projets'),
  ('gestion-risques', 'Gestion des risques', 'gestion-de-projets'),
  ('redaction-cv', 'Rédaction de CV', 'orientation-professionnelle'),
  ('lettre-motivation', 'Lettre de motivation', 'orientation-professionnelle'),
  ('entretien-embauche', 'Préparation aux entretiens', 'orientation-professionnelle'),
  ('choix-etudes', 'Choix d''études et bourses', 'orientation-professionnelle'),
  ('ecriture', 'Écriture créative', 'culture-litterature'),
  ('edition', 'Édition et publication', 'culture-litterature'),
  ('journalisme', 'Journalisme', 'culture-litterature'),
  ('design-ui-ux', 'Design UI/UX', 'design-creativite'),
  ('design-graphique', 'Design graphique', 'design-creativite'),
  ('video-photo', 'Vidéo et photographie', 'design-creativite'),
  ('comptabilite', 'Comptabilité (SYSCOHADA)', 'finance-gestion'),
  ('finance-entreprise', 'Finance d''entreprise', 'finance-gestion'),
  ('excel', 'Excel et tableurs', 'finance-gestion'),
  ('agritech', 'Agritech', 'agriculture-environnement'),
  ('energie-solaire', 'Énergie solaire', 'agriculture-environnement'),
  ('developpement-durable', 'Développement durable', 'agriculture-environnement')
) as s(slug, name, domain_slug)
join public.expertise_domains d on d.slug = s.domain_slug
on conflict (slug) do update set name = excluded.name, domain_id = excluded.domain_id;
