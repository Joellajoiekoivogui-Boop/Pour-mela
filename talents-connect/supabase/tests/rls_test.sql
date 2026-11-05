-- ════════════════════════════════════════════════════════════════════════
-- Tests de sécurité : RLS, protection des rôles et parcours MVP complet.
-- Chaque bloc « as » joue un utilisateur : rôle authenticated + sub du JWT.
-- Un échec arrête le script (ON_ERROR_STOP) avec un message explicite.
-- ════════════════════════════════════════════════════════════════════════
\set ON_ERROR_STOP on
set client_min_messages = notice;

-- ─── Utilisateurs de test (créés comme le ferait Supabase Auth) ─────────
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'awa@test.gn',     '{"role":"mentee","first_name":"Awa","last_name":"Camara"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bah@test.gn',     '{"role":"mentee","first_name":"Mamadou","last_name":"Bah"}'),
  ('00000000-0000-0000-0000-00000000000c', 'mentor@test.gn',  '{"role":"mentor","first_name":"Fatou","last_name":"Diallo"}'),
  ('00000000-0000-0000-0000-00000000000d', 'pending@test.gn', '{"role":"mentor","first_name":"Ibrahima","last_name":"Sow"}'),
  ('00000000-0000-0000-0000-00000000000e', 'hacker@test.gn',  '{"role":"admin","first_name":"Pirate"}'),
  ('00000000-0000-0000-0000-00000000000f', 'admin@test.gn',   '{"first_name":"Super","last_name":"Admin"}');

-- Premier super administrateur : attribué depuis une session serveur (éditeur SQL).
update public.profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-00000000000f';

do $$ begin
  assert (select role from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'mentee', 'Awa doit être mentee';
  assert (select role from public.profiles where id = '00000000-0000-0000-0000-00000000000c') = 'mentor', 'Fatou doit être mentor';
  assert exists (select 1 from public.mentor_profiles where user_id = '00000000-0000-0000-0000-00000000000c'), 'profil mentor créé';
  assert exists (select 1 from public.mentee_profiles where user_id = '00000000-0000-0000-0000-00000000000a'), 'profil mentoré créé';
  assert (select role from public.profiles where id = '00000000-0000-0000-0000-00000000000e') = 'mentee',
    'Un rôle « admin » demandé à l''inscription doit être ignoré';
  raise notice '✔ Inscription : rôles attribués côté serveur';
end $$;

-- ─── Super admin : vérifie le mentor Fatou ──────────────────────────────
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000f', false);
select public.admin_verify_mentor('00000000-0000-0000-0000-00000000000c', true, null);
do $$ begin
  assert (select verification_status from public.mentor_profiles where user_id = '00000000-0000-0000-0000-00000000000c') = 'verified', 'mentor vérifié';
  assert (select count(*) from public.admin_activity_logs where action = 'mentor.verify') = 1, 'action journalisée';
  assert (public.admin_overview() ->> 'mentors_pending')::int = 1, 'un mentor reste en attente';
end $$;

-- ─── Mentor : complète son profil, ne peut pas s'auto-vérifier ──────────
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
do $$ declare refused boolean := false; begin
  begin
    update public.mentor_profiles set verification_status = 'verified' where user_id = auth.uid();
  exception when insufficient_privilege then refused := true; end;
  assert refused, 'Un mentor ne doit pas pouvoir se vérifier lui-même';
  update public.mentor_profiles set job_title = 'Ingénieur' where user_id = auth.uid();
  raise notice '✔ Vérification des mentors réservée à l''administration';
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
update public.mentor_profiles set job_title = 'Développeuse Full Stack', organization = 'Orange Guinée', years_experience = 8
  where user_id = auth.uid();
insert into public.user_domains (user_id, domain_id)
  select auth.uid(), id from public.expertise_domains where slug = 'developpement-informatique';
insert into public.user_skills (user_id, skill_id, relation)
  select auth.uid(), id, 'teaches' from public.skills where slug in ('react', 'javascript', 'nodejs');
do $$ declare refused boolean := false; begin
  begin
    insert into public.user_skills (user_id, skill_id, relation) select auth.uid(), id, 'wants' from public.skills where slug = 'seo';
  exception when insufficient_privilege then refused := true; end;
  assert refused, 'Un mentor déclare des compétences transmises (teaches) uniquement';
end $$;
insert into public.availability_slots (mentor_id, starts_at, ends_at, session_types) values
  (auth.uid(), now() + interval '2 days', now() + interval '2 days 1 hour', array['video', 'audio']::public.session_type[]),
  (auth.uid(), now() + interval '3 days', now() + interval '3 days 1 hour', array['video']::public.session_type[]);

-- ─── Mentorée : ne peut pas changer son rôle ────────────────────────────
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
do $$ declare refused boolean := false; begin
  begin
    update public.profiles set role = 'admin' where id = auth.uid();
  exception when insufficient_privilege then refused := true; end;
  assert refused, 'Un utilisateur ne doit pas pouvoir changer son rôle';
  update public.profiles set location = 'Conakry', bio = 'Étudiante en informatique' where id = auth.uid();
  update public.mentee_profiles set education_level = 'licence', professional_goals = 'Devenir développeuse full stack' where user_id = auth.uid();
  insert into public.user_domains (user_id, domain_id)
    select auth.uid(), id from public.expertise_domains where slug = 'developpement-informatique';
  insert into public.user_skills (user_id, skill_id, relation)
    select auth.uid(), id, 'wants' from public.skills where slug in ('react', 'nodejs');
  raise notice '✔ Rôle protégé, profil mentoré modifiable';
end $$;

-- Visibilité : le mentor vérifié est visible, le mentor en attente et les autres mentorés non.
do $$ begin
  assert exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000c'), 'mentor vérifié visible';
  assert not exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000d'), 'mentor non vérifié invisible';
  assert not exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000b'), 'autre mentoré invisible';
  assert (select count(*) from public.user_skills where user_id = '00000000-0000-0000-0000-00000000000c') = 3, 'compétences du mentor visibles';
end $$;

-- Demande : refusée vers un mentor non vérifié, acceptée vers un mentor vérifié, pas de doublon.
do $$ declare refused boolean := false; begin
  begin
    insert into public.mentor_requests (mentee_id, mentor_id, motivation, objectives)
    values (auth.uid(), '00000000-0000-0000-0000-00000000000d', 'Je souhaite progresser en développement web.', 'Apprendre React');
  exception when insufficient_privilege then refused := true; end;
  assert refused, 'Demande vers un mentor non vérifié interdite';
end $$;
insert into public.mentor_requests (mentee_id, mentor_id, motivation, objectives, match_score)
values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c',
        'Je souhaite devenir développeuse full stack et créer des services utiles en Guinée.', 'Apprendre React et Node.js', 82);
do $$ declare refused boolean := false; begin
  begin
    insert into public.mentor_requests (mentee_id, mentor_id, motivation, objectives)
    values (auth.uid(), '00000000-0000-0000-0000-00000000000c', 'Deuxième demande identique en attente.', 'Doublon de la demande');
  exception when unique_violation then refused := true; end;
  assert refused, 'Une seule demande en attente par mentor';
  raise notice '✔ Demandes de mentorat contrôlées';
end $$;

-- ─── Un autre mentoré ne voit rien et ne peut rien accepter ─────────────
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
do $$ declare refused boolean := false; v_id uuid; begin
  assert not exists (select 1 from public.mentor_requests), 'Bah ne voit pas la demande d''Awa';
  select id into v_id from public.mentor_requests limit 1;
  begin
    perform public.respond_to_request((select id from public.mentor_requests limit 1), true, null);
  exception when others then refused := true; end;
  assert refused, 'Seul le mentor concerné peut répondre';
end $$;

-- ─── Le mentor accepte ──────────────────────────────────────────────────
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
do $$ declare v_req uuid; v_m uuid; begin
  assert exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000a'), 'le mentor voit le profil du demandeur';
  assert exists (select 1 from public.mentee_profiles where user_id = '00000000-0000-0000-0000-00000000000a'), 'et son profil mentoré';
  assert exists (select 1 from public.notifications where type = 'request_received'), 'notification de demande reçue';
  select id into v_req from public.mentor_requests where status = 'pending';
  v_m := public.respond_to_request(v_req, true, 'Avec plaisir !');
  assert v_m is not null, 'mentorat créé';
  assert (select status from public.mentor_requests where id = v_req) = 'accepted', 'demande acceptée';
  assert (select count(*) from public.conversation_members cm join public.conversations c on c.id = cm.conversation_id
          where c.mentorship_id = v_m) = 2, 'conversation à deux membres';
  raise notice '✔ Acceptation : mentorat et conversation créés';
end $$;

-- ─── La mentorée : objectifs, réservation, message ──────────────────────
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
do $$ declare v_m uuid; v_goal uuid; v_slot uuid; v_appt uuid; v_conv uuid; begin
  assert exists (select 1 from public.notifications where type = 'request_accepted'), 'notifiée de l''acceptation';
  select id into v_m from public.mentorships where status = 'active';

  insert into public.mentorship_goals (mentee_id, mentorship_id, created_by, title, priority)
    values (auth.uid(), v_m, auth.uid(), 'Devenir développeuse Full Stack', 'high') returning id into v_goal;
  insert into public.goal_milestones (goal_id, title, position) values
    (v_goal, 'Apprendre HTML et CSS', 1), (v_goal, 'Maîtriser JavaScript', 2), (v_goal, 'Apprendre React', 3);
  update public.goal_milestones set is_done = true where goal_id = v_goal and position = 1;
  assert (select status from public.mentorship_goals where id = v_goal) = 'in_progress', 'objectif en cours';

  select id into v_slot from public.availability_slots order by starts_at limit 1;
  v_appt := public.book_appointment(v_slot, v_m, 'video', 'Revue de mon portfolio');
  assert (select is_booked from public.availability_slots where id = v_slot), 'créneau réservé';
  begin
    perform public.book_appointment(v_slot, v_m, 'video', 'double');
    assert false, 'double réservation impossible';
  exception when raise_exception then null; end;

  select id into v_conv from public.conversations where mentorship_id = v_m;
  insert into public.messages (conversation_id, sender_id, body) values (v_conv, auth.uid(), 'Bonjour, merci d''avoir accepté !');
  raise notice '✔ Objectif, réservation et message côté mentorée';
end $$;

-- Pas d'insertion directe de notifications ni de lecture du journal admin.
do $$ declare refused boolean := false; begin
  begin
    insert into public.notifications (user_id, type, title) values (auth.uid(), 'mentor_verified', 'faux');
  exception when insufficient_privilege then refused := true; end;
  assert refused, 'Insertion directe de notifications interdite';
  assert not exists (select 1 from public.admin_activity_logs), 'journal admin invisible';
  refused := false;
  begin perform public.admin_overview(); exception when insufficient_privilege then refused := true; end;
  assert refused, 'Vue d''ensemble admin interdite';
  refused := false;
  begin perform public.admin_set_role('00000000-0000-0000-0000-00000000000b', 'admin'); exception when insufficient_privilege then refused := true; end;
  assert refused, 'Attribution de rôle interdite';
  refused := false;
  begin
    insert into public.opportunities (title, organization, description, category, created_by)
    values ('Faux stage', 'Fausse org', 'x', 'internship', auth.uid());
  exception when insufficient_privilege then refused := true; end;
  assert refused, 'Publication d''opportunité réservée à l''admin';
  raise notice '✔ Fonctions d''administration protégées';
end $$;

-- ─── Le mentor : confirme, commente, voit le message ────────────────────
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
do $$ declare v_appt uuid; v_goal uuid; begin
  assert exists (select 1 from public.notifications where type = 'new_message'), 'notifié du message';
  assert exists (select 1 from public.messages), 'le mentor lit la conversation';
  select id into v_appt from public.appointments where status = 'pending';
  perform public.confirm_appointment(v_appt, 'https://meet.example.org/talents');
  select id into v_goal from public.mentorship_goals limit 1;
  assert v_goal is not null, 'le mentor voit l''objectif lié au mentorat';
  insert into public.goal_comments (goal_id, author_id, body) values (v_goal, auth.uid(), 'Bon début, passe à JavaScript !');
  update public.goal_milestones set is_done = true where goal_id = v_goal;
  assert (select status from public.mentorship_goals where id = v_goal) = 'completed', 'objectif atteint quand toutes les étapes sont faites';
  raise notice '✔ Confirmation de séance et suivi des objectifs par le mentor';
end $$;

-- ─── L'autre mentoré : aucun accès aux données du mentorat ──────────────
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
do $$ declare refused boolean := false; begin
  assert not exists (select 1 from public.mentorships), 'mentorats invisibles';
  assert not exists (select 1 from public.mentorship_goals), 'objectifs invisibles';
  assert not exists (select 1 from public.messages), 'messages invisibles';
  assert not exists (select 1 from public.appointments), 'rendez-vous invisibles';
  begin
    insert into public.messages (conversation_id, sender_id, body)
    values ((select id from public.conversations limit 1), auth.uid(), 'intrus');
  exception when others then refused := true; end;
  assert refused, 'écriture dans une conversation étrangère interdite';
  refused := false;
  begin
    insert into public.reviews (mentorship_id, reviewer_id, mentor_id, rating)
    select id, auth.uid(), mentor_id, 1 from public.mentorships limit 1;
    -- (aucune ligne visible : l'insertion ne produit rien)
    refused := not exists (select 1 from public.reviews where reviewer_id = auth.uid());
  exception when insufficient_privilege then refused := true; end;
  assert refused, 'avis impossible sans mentorat';
  raise notice '✔ Isolation : un tiers ne voit aucune donnée du mentorat';
end $$;

-- ─── Mentorée : annule la séance, évalue, voit ses notifications ────────
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
do $$ declare v_appt uuid; begin
  select id into v_appt from public.appointments where status = 'confirmed';
  perform public.cancel_appointment(v_appt, 'Empêchement');
  assert not (select is_booked from public.availability_slots s join public.appointments a on a.slot_id = s.id where a.id = v_appt),
    'créneau libéré après annulation';
  insert into public.reviews (mentorship_id, reviewer_id, mentor_id, rating, comment)
    select id, auth.uid(), mentor_id, 5, 'Très à l''écoute.' from public.mentorships limit 1;
  assert exists (select 1 from public.notifications where type = 'goal_comment'), 'notifiée du commentaire';
  assert exists (select 1 from public.notifications where type = 'goal_completed'), 'notifiée de l''objectif atteint';
  assert (select count(*) from public.notifications where user_id <> auth.uid()) = 0, 'ne voit que ses notifications';
  raise notice '✔ Annulation, évaluation et notifications';
end $$;

-- ─── Super admin : rôles et opportunités ────────────────────────────────
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000f', false);
do $$ begin
  perform public.admin_set_role('00000000-0000-0000-0000-00000000000b', 'mentor');
  assert (select role from public.profiles where id = '00000000-0000-0000-0000-00000000000b') = 'mentor', 'rôle attribué';
  assert exists (select 1 from public.mentor_profiles where user_id = '00000000-0000-0000-0000-00000000000b'), 'profil mentor créé';
  insert into public.opportunities (title, organization, description, category, created_by, domain_id)
    select 'Stage développeur web', 'Incubateur Conakry', 'Stage de 3 mois', 'internship', auth.uid(), id
    from public.expertise_domains where slug = 'developpement-informatique';
  assert (select count(*) from public.admin_list_users(null, null, 50, 0)) = 6, 'liste des utilisateurs';
  raise notice '✔ Super administrateur : rôles, opportunités, liste des utilisateurs';
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
do $$ begin
  assert exists (select 1 from public.notifications where type = 'opportunity_published'), 'mentorée intéressée notifiée de l''opportunité';
end $$;

-- ─── Visiteur anonyme ───────────────────────────────────────────────────
reset role;
set role anon;
select set_config('request.jwt.claim.sub', '', false);
do $$ begin
  assert (select count(*) from public.profiles) = 1, 'un anonyme ne voit que les mentors vérifiés';
  assert not exists (select 1 from public.mentee_profiles), 'profils mentorés invisibles';
  assert not exists (select 1 from public.mentor_requests), 'demandes invisibles';
  assert (public.public_stats() ->> 'mentors')::int = 1, 'statistiques publiques';
  assert (select count(*) from public.expertise_domains) = 12, 'domaines publics';
  raise notice '✔ Visiteur anonyme : annuaire public seulement';
end $$;
reset role;

-- Compteurs de l'annuaire : accessibles aux anonymes, sans données privées.
set role anon;
do $$ begin
  assert (select active_mentees from public.mentor_directory_stats(array['00000000-0000-0000-0000-00000000000c'::uuid])) = 1, 'compteur de mentorés actifs';
  assert (select rating from public.mentor_directory_stats(array['00000000-0000-0000-0000-00000000000c'::uuid])) = 5.0, 'note moyenne';
  assert not exists (select 1 from public.mentor_directory_stats(array['00000000-0000-0000-0000-00000000000d'::uuid])), 'mentor non vérifié exclu';
  raise notice '✔ Compteurs publics de l''annuaire';
end $$;
reset role;

-- Suppression de compte : le mentoré Pirate supprime son compte, ses données disparaissent.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000e', false);
select public.delete_my_account();
reset role;
do $$ begin
  assert not exists (select 1 from auth.users where id = '00000000-0000-0000-0000-00000000000e'), 'compte supprimé';
  assert not exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000e'), 'profil supprimé en cascade';
  raise notice '✔ Suppression de compte en cascade';
end $$;

-- Apprentissage : intention sur une étape, notes de séance et révision.
insert into public.availability_slots (mentor_id, starts_at, ends_at) values ('00000000-0000-0000-0000-00000000000c', now() + interval '5 days', now() + interval '5 days 1 hour');
insert into public.appointments (mentorship_id, mentor_id, mentee_id, starts_at, ends_at, session_type, status)
  select id, mentor_id, mentee_id, now() - interval '3 days', now() - interval '3 days' + interval '1 hour', 'video', 'completed' from public.mentorships limit 1;
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
do $$ declare v_a uuid; refused boolean := false; begin
  update public.goal_milestones set intention = 'Quand je rentre des cours, je code 30 minutes.' where position = 2;
  assert exists (select 1 from public.goal_milestones where intention is not null), 'intention enregistrée';
  select id into v_a from public.appointments where status = 'completed' limit 1;
  perform public.save_session_takeaways(v_a, 'Toujours découper un projet en petites étapes.');
  perform public.mark_takeaways_reviewed(v_a);
  assert (select review_count from public.appointments where id = v_a) = 1, 'révision comptée';
  begin perform public.save_session_takeaways((select id from public.appointments where status = 'cancelled' limit 1), 'Une séance annulée ne se résume pas.');
  exception when others then refused := true; end;
  assert refused, 'notes réservées aux séances réalisées';
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
do $$ declare refused boolean := false; begin
  begin perform public.mark_takeaways_reviewed('00000000-0000-0000-0000-000000000000'); exception when others then refused := true; end;
  assert refused, 'un tiers ne peut pas réviser';
  raise notice '✔ Apprentissage : intentions, notes de séance et révision';
end $$;
reset role;
