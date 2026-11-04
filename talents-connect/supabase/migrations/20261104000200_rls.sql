-- ════════════════════════════════════════════════════════════════════════
-- TALENTS CONNECT — Sécurité au niveau des lignes (RLS) et stockage
-- Toutes les tables sont protégées. Sans politique explicite, rien n'est permis.
-- ════════════════════════════════════════════════════════════════════════

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'mentor_profiles', 'mentee_profiles', 'expertise_domains', 'skills', 'user_skills', 'user_domains',
    'mentor_requests', 'mentorships', 'mentorship_goals', 'goal_milestones', 'goal_comments',
    'availability_slots', 'appointments', 'conversations', 'conversation_members', 'messages',
    'resources', 'opportunities', 'opportunity_bookmarks', 'reviews', 'notifications', 'reports',
    'admin_activity_logs', 'ai_usage']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ─── Profils ────────────────────────────────────────────────────────────
-- Visible : soi-même, les mentors vérifiés (annuaire public), les personnes
-- avec qui l'on est en relation (demande ou mentorat), l'administration.
create policy profiles_select on public.profiles for select using (
  id = auth.uid() or public.is_verified_mentor(id) or public.is_connected_with(id) or public.is_admin()
);
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_update_admin on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy mentor_profiles_select on public.mentor_profiles for select using (
  user_id = auth.uid() or verification_status = 'verified' or public.is_connected_with(user_id) or public.is_admin()
);
create policy mentor_profiles_update_self on public.mentor_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy mentee_profiles_select on public.mentee_profiles for select to authenticated using (
  user_id = auth.uid() or public.is_connected_with(user_id) or public.is_admin()
);
create policy mentee_profiles_update_self on public.mentee_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── Référentiels ───────────────────────────────────────────────────────
create policy domains_select on public.expertise_domains for select using (true);
create policy domains_admin on public.expertise_domains for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy skills_select on public.skills for select using (true);
create policy skills_admin on public.skills for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy user_skills_select on public.user_skills for select using (
  user_id = auth.uid() or public.is_verified_mentor(user_id) or public.is_connected_with(user_id) or public.is_admin()
);
create policy user_skills_insert on public.user_skills for insert to authenticated with check (
  user_id = auth.uid()
  -- un mentor déclare ce qu'il transmet ; un mentoré ce qu'il a ou recherche
  and (relation = 'teaches') = (public.current_user_role() = 'mentor')
);
create policy user_skills_delete on public.user_skills for delete to authenticated using (user_id = auth.uid());

create policy user_domains_select on public.user_domains for select using (
  user_id = auth.uid() or public.is_verified_mentor(user_id) or public.is_connected_with(user_id) or public.is_admin()
);
create policy user_domains_insert on public.user_domains for insert to authenticated with check (user_id = auth.uid());
create policy user_domains_delete on public.user_domains for delete to authenticated using (user_id = auth.uid());

-- ─── Demandes de mentorat ───────────────────────────────────────────────
-- Création directe par le mentoré (vers un mentor vérifié) ; toute
-- transition ultérieure passe par respond_to_request / cancel_request.
create policy requests_select on public.mentor_requests for select to authenticated using (
  auth.uid() in (mentee_id, mentor_id) or public.is_admin()
);
create policy requests_insert on public.mentor_requests for insert to authenticated with check (
  mentee_id = auth.uid()
  and status = 'pending' and response_message is null and responded_at is null
  and public.current_user_role() = 'mentee'
  and public.is_verified_mentor(mentor_id)
);

-- ─── Mentorats (créés par respond_to_request) ───────────────────────────
create policy mentorships_select on public.mentorships for select to authenticated using (
  auth.uid() in (mentee_id, mentor_id) or public.is_admin()
);

-- ─── Objectifs ──────────────────────────────────────────────────────────
-- Conditions écrites sur la ligne elle-même (et non via can_view_goal) : un
-- INSERT … RETURNING doit pouvoir relire la ligne qu'il vient de créer.
create policy goals_select on public.mentorship_goals for select to authenticated using (
  mentee_id = auth.uid() or public.is_mentorship_participant(mentorship_id) or public.is_admin()
);
create policy goals_insert on public.mentorship_goals for insert to authenticated with check (
  created_by = auth.uid()
  and (
    (mentee_id = auth.uid() and (mentorship_id is null or public.is_mentorship_participant(mentorship_id)))
    or exists (select 1 from public.mentorships m
               where m.id = mentorship_id and m.mentor_id = auth.uid() and m.mentee_id = mentorship_goals.mentee_id and m.status = 'active')
  )
);
create policy goals_update on public.mentorship_goals for update to authenticated
  using (mentee_id = auth.uid() or public.is_active_mentor_of(mentorship_id))
  with check (mentorship_id is null or public.is_mentorship_participant(mentorship_id));
create policy goals_delete on public.mentorship_goals for delete to authenticated using (mentee_id = auth.uid());

create policy milestones_select on public.goal_milestones for select to authenticated using (public.can_view_goal(goal_id));
create policy milestones_insert on public.goal_milestones for insert to authenticated with check (public.can_edit_goal(goal_id));
create policy milestones_update on public.goal_milestones for update to authenticated
  using (public.can_edit_goal(goal_id)) with check (public.can_edit_goal(goal_id));
create policy milestones_delete on public.goal_milestones for delete to authenticated using (public.can_edit_goal(goal_id));

create policy goal_comments_select on public.goal_comments for select to authenticated using (public.can_view_goal(goal_id));
create policy goal_comments_insert on public.goal_comments for insert to authenticated with check (
  author_id = auth.uid() and public.can_view_goal(goal_id)
);
create policy goal_comments_delete on public.goal_comments for delete to authenticated using (author_id = auth.uid());

-- ─── Disponibilités et rendez-vous ──────────────────────────────────────
create policy slots_select on public.availability_slots for select to authenticated using (true);
create policy slots_insert on public.availability_slots for insert to authenticated with check (
  mentor_id = auth.uid() and public.current_user_role() = 'mentor' and not is_booked and starts_at > now()
);
create policy slots_update on public.availability_slots for update to authenticated
  using (mentor_id = auth.uid() and not is_booked) with check (mentor_id = auth.uid() and not is_booked);
create policy slots_delete on public.availability_slots for delete to authenticated using (mentor_id = auth.uid() and not is_booked);

create policy appointments_select on public.appointments for select to authenticated using (
  auth.uid() in (mentor_id, mentee_id) or public.is_admin()
);

-- ─── Messagerie (membres uniquement, l'administration n'y a pas accès) ──
create policy conversations_select on public.conversations for select to authenticated using (public.is_conversation_member(id));
create policy members_select on public.conversation_members for select to authenticated using (public.is_conversation_member(conversation_id));
create policy messages_select on public.messages for select to authenticated using (public.is_conversation_member(conversation_id));
create policy messages_insert on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and public.is_conversation_member(conversation_id)
  and exists (select 1 from public.conversations c join public.mentorships m on m.id = c.mentorship_id
              where c.id = conversation_id and m.status = 'active')
);

-- ─── Ressources ─────────────────────────────────────────────────────────
create policy resources_select on public.resources for select using (
  is_published or author_id = auth.uid() or public.is_admin()
);
create policy resources_insert on public.resources for insert to authenticated with check (
  author_id = auth.uid() and public.current_user_role() in ('mentor', 'admin', 'super_admin')
);
create policy resources_update on public.resources for update to authenticated
  using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());
create policy resources_delete on public.resources for delete to authenticated using (author_id = auth.uid() or public.is_admin());

-- ─── Opportunités (gérées par l'administration) ─────────────────────────
create policy opportunities_select on public.opportunities for select using (is_published or public.is_admin());
create policy opportunities_admin on public.opportunities for all to authenticated
  using (public.is_admin()) with check (public.is_admin() and created_by = auth.uid());

create policy bookmarks_own on public.opportunity_bookmarks for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── Évaluations ────────────────────────────────────────────────────────
create policy reviews_select on public.reviews for select using (
  not is_hidden or reviewer_id = auth.uid() or public.is_admin()
);
create policy reviews_insert on public.reviews for insert to authenticated with check (
  reviewer_id = auth.uid() and not is_hidden
  and exists (select 1 from public.mentorships m
              where m.id = mentorship_id and m.mentee_id = auth.uid() and m.mentor_id = reviews.mentor_id)
);
create policy reviews_admin on public.reviews for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ─── Notifications ──────────────────────────────────────────────────────
create policy notifications_select on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_delete on public.notifications for delete to authenticated using (user_id = auth.uid());

-- ─── Signalements, journal, IA ──────────────────────────────────────────
create policy reports_insert on public.reports for insert to authenticated with check (
  reporter_id = auth.uid() and status = 'open' and handled_by is null
);
create policy reports_select on public.reports for select to authenticated using (reporter_id = auth.uid() or public.is_admin());

create policy admin_logs_select on public.admin_activity_logs for select to authenticated using (public.is_admin());

create policy ai_usage_select on public.ai_usage for select to authenticated using (user_id = auth.uid());
create policy ai_usage_insert on public.ai_usage for insert to authenticated with check (user_id = auth.uid());

-- ─── Droits sur les tables ──────────────────────────────────────────────
-- Les politiques ci-dessus décident ligne par ligne ; ces GRANT ouvrent l'accès
-- de base (Supabase les accorde déjà par défaut, on les rend explicites).
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
-- Le journal d'administration n'est écrit que par les fonctions du serveur.
revoke insert, update, delete on public.admin_activity_logs from authenticated;
revoke insert, update, delete on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;
grant delete on public.notifications to authenticated;
revoke update on public.conversation_members from authenticated;

-- ─── Temps réel : messages et notifications ─────────────────────────────
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages, public.notifications;
  end if;
end $$;

-- ─── Stockage (Supabase Storage) ────────────────────────────────────────
-- avatars    : public, chaque utilisateur écrit dans le dossier <son id>/
-- resources  : public (bibliothèque), écrit par les mentors et l'administration
-- attachments: privé, dossier <conversation_id>/, lisible par les membres seulement
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('resources', 'resources', true),
  ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy avatars_read on storage.objects for select using (bucket_id = 'avatars');
create policy avatars_write on storage.objects for insert to authenticated with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy avatars_update on storage.objects for update to authenticated using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy avatars_delete on storage.objects for delete to authenticated using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

create policy resources_files_read on storage.objects for select using (bucket_id = 'resources');
create policy resources_files_write on storage.objects for insert to authenticated with check (
  bucket_id = 'resources' and (storage.foldername(name))[1] = auth.uid()::text
  and public.current_user_role() in ('mentor', 'admin', 'super_admin')
);
create policy resources_files_delete on storage.objects for delete to authenticated using (
  bucket_id = 'resources' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

create policy attachments_read on storage.objects for select to authenticated using (
  bucket_id = 'attachments' and public.is_conversation_member(((storage.foldername(name))[1])::uuid)
);
create policy attachments_write on storage.objects for insert to authenticated with check (
  bucket_id = 'attachments' and public.is_conversation_member(((storage.foldername(name))[1])::uuid)
);
