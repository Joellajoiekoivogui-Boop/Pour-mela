-- ════════════════════════════════════════════════════════════════════
-- CONTEVERSE — schéma initial
-- Principes : données personnelles minimales (pseudonyme, avatar, tranche
-- d'âge), RLS activée partout, rôles admin / éditeur / utilisateur.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─── Types ──────────────────────────────────────────────────────────
create type public.app_role as enum ('admin', 'editeur', 'utilisateur');
create type public.publication_status as enum ('brouillon', 'relecture', 'publie', 'archive');
create type public.editorial_status as enum ('verifie', 'a-valider');
create type public.review_status as enum ('en_attente', 'approuve', 'rejete');
create type public.age_group as enum ('7-9', '10-12');

-- ─── Horodatage automatique ────────────────────────────────────────
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ════════════════════════ UTILISATEURS ═════════════════════════════

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  pseudo text check (pseudo is null or char_length(pseudo) between 2 and 20),
  avatar text not null default 'awa' check (avatar in ('awa', 'kofi', 'mariama', 'sekou', 'zara', 'ibrahim')),
  age_group public.age_group not null default '7-9',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Profil apprenant minimal : aucun nom réel, aucune date de naissance, aucune localisation.';

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, role)
);

create table public.parental_accounts (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.profiles (id) on delete cascade,
  child_id uuid not null references public.profiles (id) on delete cascade,
  relation text not null default 'parent' check (relation in ('parent', 'enseignant', 'tuteur')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guardian_id, child_id),
  check (guardian_id <> child_id)
);

-- Fonctions d'autorisation (security definer : évitent la récursion RLS).
create or replace function public.has_role(r public.app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = r);
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'editeur'));
$$;

create or replace function public.is_guardian_of(child uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.parental_accounts where guardian_id = auth.uid() and child_id = child);
$$;

-- Création automatique du profil et du rôle « utilisateur » à l'inscription.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'utilisateur') on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ════════════════════════ GÉOGRAPHIE ═══════════════════════════════

create table public.countries (
  id uuid primary key default gen_random_uuid(),
  code char(2) not null unique check (code ~ '^[A-Z]{2}$'),
  name text not null,
  capital text,
  has_sheet boolean not null default false,
  disputed boolean not null default false,
  location text,
  population_note text,
  currency text,
  official_language text,
  motto text,
  flag_note text,
  independence_date text,
  independence_text text,
  fun_fact text,
  sheet jsonb not null default '{}'::jsonb,
  editorial_status public.editorial_status not null default 'a-valider',
  validation_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.regions (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('naturelle', 'administrative')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_id, kind, name)
);

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries (id) on delete cascade,
  region_id uuid references public.regions (id) on delete set null,
  name text not null,
  description text,
  is_capital boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_id, name)
);

create table public.languages (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  other_names text[] not null default '{}',
  description text,
  editorial_status public.editorial_status not null default 'a-valider',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.country_languages (
  country_id uuid not null references public.countries (id) on delete cascade,
  language_id uuid not null references public.languages (id) on delete cascade,
  is_official boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (country_id, language_id)
);

-- ════════════════════════ CONTENUS ═════════════════════════════════

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  short_name text not null,
  description text not null,
  icon text not null,
  color text not null check (color in ('orange', 'vert', 'jaune', 'violet', 'bleu')),
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  publisher text,
  url text check (url is null or url ~ '^https?://'),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (title, publisher)
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  kind text not null check (kind in ('image', 'audio', 'video', 'document')),
  alt_text text,
  credit text,
  license text,
  rights_cleared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.media_assets.rights_cleared is 'Autorisation obtenue pour les médias protégés.';

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  category_id uuid not null references public.categories (id) on delete restrict,
  country_id uuid references public.countries (id) on delete set null,
  scope text not null default 'AF',
  difficulty text not null check (difficulty in ('facile', 'moyen', 'avance')),
  age_min int not null check (age_min between 5 and 15),
  age_max int not null check (age_max between 5 and 15),
  reading_minutes int not null check (reading_minutes > 0),
  content_type text not null check (content_type in ('documentaire', 'portrait', 'explication', 'fiche')),
  scene text,
  intro text not null,
  glossary jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  cover_media_id uuid references public.media_assets (id) on delete set null,
  audio_media_id uuid references public.media_assets (id) on delete set null,
  status public.publication_status not null default 'brouillon',
  editorial_status public.editorial_status not null default 'a-valider',
  validation_note text,
  author_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (age_min <= age_max)
);
create index articles_category_idx on public.articles (category_id);
create index articles_country_idx on public.articles (country_id);

create table public.article_sections (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  position int not null,
  heading text not null,
  paragraphs text[] not null,
  did_you_know text,
  uncertainty text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (article_id, position)
);

create table public.article_sources (
  article_id uuid not null references public.articles (id) on delete cascade,
  source_id uuid not null references public.sources (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (article_id, source_id)
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  genre text not null check (genre in ('conte', 'epopee', 'fiction', 'recit-historique')),
  disclaimer text not null,
  scope text not null default 'AF',
  age_min int not null,
  reading_minutes int not null,
  scene text,
  summary text not null,
  interactive boolean not null default false,
  start_node text not null,
  credits text not null,
  rights_note text,
  status public.publication_status not null default 'brouillon',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.story_nodes (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  node_key text not null,
  paragraphs text[] not null,
  scene text,
  ending_title text,
  ending_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_id, node_key)
);

create table public.story_choices (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  from_node text not null,
  to_node text not null,
  label text not null,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (story_id, from_node) references public.story_nodes (story_id, node_key) on delete cascade,
  foreign key (story_id, to_node) references public.story_nodes (story_id, node_key) on delete cascade
);

create table public.personalities (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references public.countries (id) on delete set null,
  name text not null,
  role text not null,
  description text,
  editorial_status public.editorial_status not null default 'a-valider',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_id, name)
);

create table public.historical_events (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references public.countries (id) on delete cascade,
  when_label text not null,
  title text not null,
  description text not null,
  is_uncertain boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cultural_heritage (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references public.countries (id) on delete cascade,
  name text not null,
  description text,
  unesco boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.natural_sites (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references public.countries (id) on delete cascade,
  name text not null,
  description text,
  unesco boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ════════════════════════ APPRENTISSAGE ════════════════════════════

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  description text,
  kind text not null,
  scope text not null default 'AF',
  category_id uuid references public.categories (id) on delete set null,
  article_id uuid references public.articles (id) on delete cascade,
  story_id uuid references public.stories (id) on delete cascade,
  status public.publication_status not null default 'brouillon',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  position int not null,
  external_id text,
  question text not null,
  explanation text not null,
  flag_code char(2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quiz_id, position)
);

create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions (id) on delete cascade,
  position int not null,
  label text not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, position)
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  hint text not null,
  icon text not null,
  color text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_type text not null check (item_type in ('quiz', 'story', 'daily', 'reading_time')),
  item_slug text not null,
  score int check (score is null or score >= 0),
  total int check (total is null or total >= 0),
  attempts int not null default 1 check (attempts >= 0),
  data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_type, item_slug)
);

create table public.reading_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  article_slug text not null references public.articles (slug) on update cascade on delete cascade,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, article_slug)
);

create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement_code text not null references public.achievements (code) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, achievement_code)
);

create table public.country_discoveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  country_code char(2) not null references public.countries (code) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, country_code)
);

-- ════════════════════════ ADMINISTRATION ═══════════════════════════

create table public.content_reviews (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('article', 'story', 'country', 'quiz', 'language')),
  content_slug text not null,
  comment text not null check (char_length(comment) between 3 and 2000),
  status public.review_status not null default 'en_attente',
  author_id uuid references public.profiles (id) on delete set null,
  reviewer_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.moderation_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_table text not null,
  target_id text,
  details jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Triggers updated_at sur toutes les tables ─────────────────────
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
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated_at', t);
  end loop;
end $$;
