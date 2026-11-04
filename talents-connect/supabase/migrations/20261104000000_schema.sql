-- ════════════════════════════════════════════════════════════════════════
-- TALENTS CONNECT — Schéma de la base de données (tables, types, index)
-- Les fonctions métier sont dans 20261104000100_functions.sql,
-- la sécurité (RLS) dans 20261104000200_rls.sql.
-- ════════════════════════════════════════════════════════════════════════

-- ─── Types énumérés ─────────────────────────────────────────────────────
create type public.user_role as enum ('mentee', 'mentor', 'admin', 'super_admin');
create type public.verification_status as enum ('pending', 'verified', 'rejected');
-- Cycle d'une demande : en attente → acceptée (le mentorat est « en cours ») → terminée,
-- ou refusée / annulée. Le statut « en cours » est porté par le mentorat lui-même.
create type public.request_status as enum ('pending', 'accepted', 'refused', 'completed', 'cancelled');
create type public.mentorship_status as enum ('active', 'completed', 'cancelled');
create type public.appointment_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
create type public.session_type as enum ('in_person', 'video', 'audio', 'written');
create type public.goal_status as enum ('not_started', 'in_progress', 'completed', 'abandoned');
create type public.goal_priority as enum ('low', 'medium', 'high');
-- has = compétence possédée (mentoré), wants = recherchée (mentoré), teaches = transmise (mentor)
create type public.skill_relation as enum ('has', 'wants', 'teaches');
create type public.resource_type as enum ('pdf', 'image', 'link', 'video');
create type public.opportunity_category as enum (
  'internship', 'job', 'training', 'scholarship', 'hackathon',
  'contest', 'incubator', 'call_for_projects', 'conference', 'networking'
);
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
create type public.notification_type as enum (
  'request_received', 'request_accepted', 'request_refused', 'request_cancelled',
  'new_message', 'appointment_requested', 'appointment_confirmed', 'appointment_cancelled',
  'session_reminder', 'goal_completed', 'goal_comment', 'opportunity_published',
  'resource_published', 'mentor_verified', 'mentor_rejected', 'mentorship_completed'
);

-- ─── Utilitaire : updated_at automatique ────────────────────────────────
create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ─── Profils ────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'mentee',
  first_name text not null default '' check (char_length(first_name) <= 80),
  last_name text not null default '' check (char_length(last_name) <= 80),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 500),
  location text check (char_length(location) <= 120),
  bio text check (char_length(bio) <= 2000),
  is_demo boolean not null default false,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);

create table public.mentor_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  job_title text check (char_length(job_title) <= 120),
  organization text check (char_length(organization) <= 120),
  years_experience smallint not null default 0 check (years_experience between 0 and 60),
  education text check (char_length(education) <= 1000),
  experiences text check (char_length(experiences) <= 3000),
  languages text[] not null default array['Français'],
  availability_note text check (char_length(availability_note) <= 500),
  support_types public.session_type[] not null default array['video', 'written']::public.session_type[],
  max_mentees smallint not null default 5 check (max_mentees between 1 and 50),
  verification_status public.verification_status not null default 'pending',
  verified_at timestamptz,
  verified_by uuid references public.profiles (id) on delete set null,
  rejection_reason text check (char_length(rejection_reason) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index mentor_profiles_verification_idx on public.mentor_profiles (verification_status);

create table public.mentee_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  birth_date date check (birth_date is null or birth_date > date '1940-01-01'),
  education_level text check (education_level in ('secondaire', 'bac', 'licence', 'master', 'doctorat', 'formation_pro', 'autodidacte', 'professionnel')),
  institution text check (char_length(institution) <= 160),
  field_of_study text check (char_length(field_of_study) <= 160),
  interests text check (char_length(interests) <= 1000),
  professional_goals text check (char_length(professional_goals) <= 2000),
  project_needs text check (char_length(project_needs) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Référentiels : domaines et compétences ─────────────────────────────
create table public.expertise_domains (
  id smallint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  description text not null default '',
  icon text not null default 'sparkles',
  sort_order smallint not null default 0
);

create table public.skills (
  id integer generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  domain_id smallint references public.expertise_domains (id) on delete set null
);
create index skills_domain_idx on public.skills (domain_id);

create table public.user_skills (
  user_id uuid not null references public.profiles (id) on delete cascade,
  skill_id integer not null references public.skills (id) on delete cascade,
  relation public.skill_relation not null,
  created_at timestamptz not null default now(),
  primary key (user_id, skill_id, relation)
);
create index user_skills_skill_idx on public.user_skills (skill_id);

-- Domaines d'expertise (mentor) ou domaines recherchés (mentoré)
create table public.user_domains (
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id smallint not null references public.expertise_domains (id) on delete cascade,
  primary key (user_id, domain_id)
);
create index user_domains_domain_idx on public.user_domains (domain_id);

-- ─── Demandes et mentorats ──────────────────────────────────────────────
create table public.mentor_requests (
  id uuid primary key default gen_random_uuid(),
  mentee_id uuid not null references public.profiles (id) on delete cascade,
  mentor_id uuid not null references public.profiles (id) on delete cascade,
  motivation text not null check (char_length(motivation) between 20 and 2000),
  objectives text not null check (char_length(objectives) between 10 and 2000),
  match_score smallint check (match_score between 0 and 100),
  status public.request_status not null default 'pending',
  response_message text check (char_length(response_message) <= 1000),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (mentee_id <> mentor_id)
);
-- Une seule demande en attente par couple mentoré / mentor
create unique index mentor_requests_one_pending on public.mentor_requests (mentee_id, mentor_id) where status = 'pending';
create index mentor_requests_mentor_idx on public.mentor_requests (mentor_id, status);
create index mentor_requests_mentee_idx on public.mentor_requests (mentee_id, status);

create table public.mentorships (
  id uuid primary key default gen_random_uuid(),
  request_id uuid unique references public.mentor_requests (id) on delete set null,
  mentor_id uuid not null references public.profiles (id) on delete cascade,
  mentee_id uuid not null references public.profiles (id) on delete cascade,
  status public.mentorship_status not null default 'active',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (mentee_id <> mentor_id)
);
create unique index mentorships_one_active on public.mentorships (mentor_id, mentee_id) where status = 'active';
create index mentorships_mentee_idx on public.mentorships (mentee_id, status);
create index mentorships_mentor_idx on public.mentorships (mentor_id, status);

-- ─── Objectifs et étapes ────────────────────────────────────────────────
create table public.mentorship_goals (
  id uuid primary key default gen_random_uuid(),
  mentee_id uuid not null references public.profiles (id) on delete cascade,
  -- Mentorat associé (facultatif) : son mentor peut alors voir et commenter l'objectif
  mentorship_id uuid references public.mentorships (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  title text not null check (char_length(title) between 3 and 160),
  description text check (char_length(description) <= 2000),
  priority public.goal_priority not null default 'medium',
  status public.goal_status not null default 'not_started',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index goals_mentee_idx on public.mentorship_goals (mentee_id, status);
create index goals_mentorship_idx on public.mentorship_goals (mentorship_id);

create table public.goal_milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.mentorship_goals (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 200),
  position smallint not null default 0,
  is_done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index milestones_goal_idx on public.goal_milestones (goal_id, position);

create table public.goal_comments (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.mentorship_goals (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index goal_comments_goal_idx on public.goal_comments (goal_id, created_at);

-- ─── Disponibilités et rendez-vous ──────────────────────────────────────
-- Les horaires sont stockés en UTC (timestamptz) ; l'affichage se fait
-- dans le fuseau Africa/Conakry (ou celui de l'utilisateur).
create table public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.profiles (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  session_types public.session_type[] not null default array['video']::public.session_type[],
  is_booked boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (ends_at - starts_at <= interval '4 hours'),
  check (cardinality(session_types) > 0)
);
create index slots_mentor_idx on public.availability_slots (mentor_id, starts_at);
-- Pas deux créneaux qui commencent au même moment pour un mentor
create unique index slots_unique_start on public.availability_slots (mentor_id, starts_at);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  mentorship_id uuid not null references public.mentorships (id) on delete cascade,
  slot_id uuid references public.availability_slots (id) on delete set null,
  mentor_id uuid not null references public.profiles (id) on delete cascade,
  mentee_id uuid not null references public.profiles (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  session_type public.session_type not null,
  status public.appointment_status not null default 'pending',
  topic text check (char_length(topic) <= 300),
  location_or_link text check (char_length(location_or_link) <= 500),
  mentor_notes text check (char_length(mentor_notes) <= 3000),
  cancel_reason text check (char_length(cancel_reason) <= 500),
  cancelled_by uuid references public.profiles (id) on delete set null,
  rescheduled_from uuid references public.appointments (id) on delete set null,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index appointments_mentor_idx on public.appointments (mentor_id, starts_at);
create index appointments_mentee_idx on public.appointments (mentee_id, starts_at);
create index appointments_mentorship_idx on public.appointments (mentorship_id);

-- ─── Messagerie ─────────────────────────────────────────────────────────
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  mentorship_id uuid unique references public.mentorships (id) on delete cascade,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index conversation_members_user_idx on public.conversation_members (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null default '' check (char_length(body) <= 4000),
  attachment_path text check (char_length(attachment_path) <= 500),
  attachment_name text check (char_length(attachment_name) <= 200),
  created_at timestamptz not null default now(),
  check (char_length(body) > 0 or attachment_path is not null)
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

-- ─── Bibliothèque de ressources ─────────────────────────────────────────
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles (id) on delete set null,
  domain_id smallint references public.expertise_domains (id) on delete set null,
  title text not null check (char_length(title) between 3 and 200),
  description text check (char_length(description) <= 2000),
  type public.resource_type not null,
  url text check (url is null or url ~* '^https?://'),
  file_path text check (char_length(file_path) <= 500),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (url is not null or file_path is not null)
);
create index resources_domain_idx on public.resources (domain_id, created_at desc);

-- ─── Opportunités ───────────────────────────────────────────────────────
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles (id) on delete set null,
  domain_id smallint references public.expertise_domains (id) on delete set null,
  title text not null check (char_length(title) between 3 and 200),
  organization text not null check (char_length(organization) between 2 and 160),
  description text not null check (char_length(description) <= 5000),
  category public.opportunity_category not null,
  location text check (char_length(location) <= 160),
  deadline date,
  requirements text check (char_length(requirements) <= 3000),
  apply_url text check (apply_url is null or apply_url ~* '^https?://'),
  image_url text check (image_url is null or image_url ~* '^https?://'),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index opportunities_listing_idx on public.opportunities (is_published, deadline);

create table public.opportunity_bookmarks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

-- ─── Évaluations ────────────────────────────────────────────────────────
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  mentorship_id uuid not null references public.mentorships (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  mentor_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1500),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (mentorship_id, reviewer_id)
);
create index reviews_mentor_idx on public.reviews (mentor_id);

-- ─── Notifications ──────────────────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  link text check (link is null or link ~ '^/'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

-- ─── Signalements et journal d'administration ───────────────────────────
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  target_user_id uuid references public.profiles (id) on delete set null,
  target_type text not null check (target_type in ('user', 'message', 'resource', 'opportunity', 'review')),
  target_id uuid,
  reason text not null check (char_length(reason) between 3 and 200),
  details text check (char_length(details) <= 2000),
  status public.report_status not null default 'open',
  handled_by uuid references public.profiles (id) on delete set null,
  handled_at timestamptz,
  resolution_note text check (char_length(resolution_note) <= 1000),
  created_at timestamptz not null default now()
);
create index reports_status_idx on public.reports (status, created_at desc);

create table public.admin_activity_logs (
  id bigint generated always as identity primary key,
  admin_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index admin_logs_created_idx on public.admin_activity_logs (created_at desc);

-- ─── Suivi d'utilisation de l'IA (limite quotidienne) ───────────────────
create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  mode text not null check (char_length(mode) <= 40),
  created_at timestamptz not null default now()
);
create index ai_usage_user_idx on public.ai_usage (user_id, created_at desc);

-- ─── updated_at ─────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['profiles', 'mentor_profiles', 'mentee_profiles', 'mentor_requests', 'mentorships',
                           'mentorship_goals', 'appointments', 'resources', 'opportunities']
  loop
    execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()',
                   t || '_touch_updated_at', t);
  end loop;
end $$;
