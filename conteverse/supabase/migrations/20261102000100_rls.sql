-- ════════════════════════════════════════════════════════════════════
-- CONTEVERSE — politiques de sécurité (Row Level Security)
-- ════════════════════════════════════════════════════════════════════

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','user_roles','parental_accounts','countries','regions','cities','languages','country_languages',
    'categories','sources','media_assets','articles','article_sections','article_sources','stories','story_nodes',
    'story_choices','personalities','historical_events','cultural_heritage','natural_sites','quizzes','quiz_questions',
    'quiz_answers','achievements','user_progress','reading_history','user_achievements','country_discoveries',
    'content_reviews','moderation_logs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ─── Profils ───────────────────────────────────────────────────────
create policy "profil : lecture par soi, un responsable ou un admin"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_guardian_of(id) or public.has_role('admin'));
create policy "profil : modification par soi"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- (création uniquement via le trigger handle_new_user)

-- ─── Rôles : seuls les administrateurs les attribuent ──────────────
create policy "rôles : lecture de ses propres rôles ou par un admin"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role('admin'));
create policy "rôles : gestion par un admin"
  on public.user_roles for all to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));

-- ─── Comptes parentaux : liens créés par l'administration (vérification hors ligne) ─
create policy "liens parentaux : lecture par les personnes concernées"
  on public.parental_accounts for select to authenticated
  using (guardian_id = auth.uid() or child_id = auth.uid() or public.has_role('admin'));
create policy "liens parentaux : gestion par un admin"
  on public.parental_accounts for all to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));

-- ─── Contenus de référence : lecture publique, écriture par l'équipe ─
do $$
declare t text;
begin
  foreach t in array array[
    'countries','regions','cities','languages','country_languages','categories','sources','media_assets',
    'personalities','historical_events','cultural_heritage','natural_sites','achievements'
  ] loop
    execute format('create policy "lecture publique" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "ajout par l''équipe" on public.%I for insert to authenticated with check (public.is_staff())', t);
    execute format('create policy "modification par l''équipe" on public.%I for update to authenticated using (public.is_staff()) with check (public.is_staff())', t);
    execute format('create policy "suppression par un admin" on public.%I for delete to authenticated using (public.has_role(''admin''))', t);
  end loop;
end $$;

-- ─── Contenus éditoriaux : seuls les contenus publiés sont visibles du public ─
do $$
declare t text;
begin
  foreach t in array array['articles', 'stories', 'quizzes'] loop
    execute format('create policy "lecture des contenus publiés" on public.%I for select to anon, authenticated using (status = ''publie'' or public.is_staff())', t);
    execute format('create policy "ajout par l''équipe" on public.%I for insert to authenticated with check (public.is_staff())', t);
    execute format('create policy "modification par l''équipe" on public.%I for update to authenticated using (public.is_staff()) with check (public.is_staff())', t);
    execute format('create policy "suppression par un admin" on public.%I for delete to authenticated using (public.has_role(''admin''))', t);
  end loop;
end $$;

-- Tables enfants : visibles si le contenu parent l'est.
create policy "lecture" on public.article_sections for select to anon, authenticated
  using (exists (select 1 from public.articles a where a.id = article_id and (a.status = 'publie' or public.is_staff())));
create policy "lecture" on public.article_sources for select to anon, authenticated
  using (exists (select 1 from public.articles a where a.id = article_id and (a.status = 'publie' or public.is_staff())));
create policy "lecture" on public.story_nodes for select to anon, authenticated
  using (exists (select 1 from public.stories s where s.id = story_id and (s.status = 'publie' or public.is_staff())));
create policy "lecture" on public.story_choices for select to anon, authenticated
  using (exists (select 1 from public.stories s where s.id = story_id and (s.status = 'publie' or public.is_staff())));
create policy "lecture" on public.quiz_questions for select to anon, authenticated
  using (exists (select 1 from public.quizzes q where q.id = quiz_id and (q.status = 'publie' or public.is_staff())));
create policy "lecture" on public.quiz_answers for select to anon, authenticated
  using (exists (select 1 from public.quiz_questions qq join public.quizzes q on q.id = qq.quiz_id where qq.id = question_id and (q.status = 'publie' or public.is_staff())));

do $$
declare t text;
begin
  foreach t in array array['article_sections', 'article_sources', 'story_nodes', 'story_choices', 'quiz_questions', 'quiz_answers'] loop
    execute format('create policy "écriture par l''équipe" on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
end $$;

-- ─── Progression : chacun ne voit et n'écrit que la sienne ──────────
do $$
declare t text;
begin
  foreach t in array array['user_progress', 'reading_history', 'user_achievements', 'country_discoveries'] loop
    execute format('create policy "lecture : soi ou un responsable lié" on public.%I for select to authenticated using (user_id = auth.uid() or public.is_guardian_of(user_id))', t);
    execute format('create policy "ajout : soi" on public.%I for insert to authenticated with check (user_id = auth.uid())', t);
    execute format('create policy "modification : soi" on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create policy "suppression : soi" on public.%I for delete to authenticated using (user_id = auth.uid())', t);
  end loop;
end $$;

-- ─── Relectures : tout adulte connecté peut signaler, l'équipe traite ─
create policy "relectures : signalement" on public.content_reviews for insert to authenticated
  with check (author_id = auth.uid() and status = 'en_attente');
create policy "relectures : lecture par l'auteur ou l'équipe" on public.content_reviews for select to authenticated
  using (author_id = auth.uid() or public.is_staff());
create policy "relectures : traitement par l'équipe" on public.content_reviews for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ─── Journal de modération : écrit par l'équipe, lu par les admins, jamais modifié ─
create policy "journal : ajout par l'équipe" on public.moderation_logs for insert to authenticated
  with check (public.is_staff() and actor_id = auth.uid());
create policy "journal : lecture par un admin" on public.moderation_logs for select to authenticated
  using (public.has_role('admin'));

-- ─── Stockage des médias (Supabase Storage) ─────────────────────────
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;

create policy "médias : lecture publique" on storage.objects for select to anon, authenticated
  using (bucket_id = 'media');
create policy "médias : envoi par l'équipe" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_staff());
create policy "médias : modification par l'équipe" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_staff());
create policy "médias : suppression par un admin" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.has_role('admin'));
