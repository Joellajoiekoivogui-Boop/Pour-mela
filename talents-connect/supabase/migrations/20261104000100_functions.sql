-- ════════════════════════════════════════════════════════════════════════
-- TALENTS CONNECT — Fonctions métier, déclencheurs et notifications
--
-- Principe de sécurité : les transitions sensibles (accepter une demande,
-- réserver un créneau, vérifier un mentor, changer un rôle…) passent par des
-- fonctions SECURITY DEFINER qui vérifient elles-mêmes l'identité de
-- l'appelant (auth.uid()). Les tables correspondantes n'ont pas de politique
-- d'écriture directe : le navigateur ne peut pas contourner ces règles.
-- ════════════════════════════════════════════════════════════════════════

-- ─── Fonctions d'aide (utilisées par les politiques RLS) ────────────────
create function public.current_user_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin') and not is_suspended
  )
$$;

create function public.is_super_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin' and not is_suspended
  )
$$;

create function public.is_verified_mentor(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.mentor_profiles mp
    join public.profiles p on p.id = mp.user_id
    where mp.user_id = p_user and mp.verification_status = 'verified'
      and p.role = 'mentor' and not p.is_suspended
  )
$$;

-- Vrai si l'utilisateur courant et p_other sont liés par une demande ou un mentorat.
create function public.is_connected_with(p_other uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.mentor_requests r
    where (r.mentee_id = auth.uid() and r.mentor_id = p_other)
       or (r.mentor_id = auth.uid() and r.mentee_id = p_other)
  ) or exists (
    select 1 from public.mentorships m
    where (m.mentee_id = auth.uid() and m.mentor_id = p_other)
       or (m.mentor_id = auth.uid() and m.mentee_id = p_other)
  )
$$;

create function public.is_mentorship_participant(p_mentorship uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.mentorships
    where id = p_mentorship and auth.uid() in (mentor_id, mentee_id)
  )
$$;

create function public.is_conversation_member(p_conversation uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = p_conversation and user_id = auth.uid()
  )
$$;

create function public.is_active_mentor_of(p_mentorship uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.mentorships
    where id = p_mentorship and mentor_id = auth.uid() and status = 'active'
  )
$$;

-- Lecture d'un objectif : le mentoré, le mentor du mentorat associé, un admin.
create function public.can_view_goal(p_goal uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.mentorship_goals g
    left join public.mentorships m on m.id = g.mentorship_id
    where g.id = p_goal
      and (g.mentee_id = auth.uid() or m.mentor_id = auth.uid() or public.is_admin())
  )
$$;

-- Modification d'un objectif : le mentoré ou le mentor d'un mentorat actif associé.
create function public.can_edit_goal(p_goal uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.mentorship_goals g
    left join public.mentorships m on m.id = g.mentorship_id
    where g.id = p_goal
      and (g.mentee_id = auth.uid() or (m.mentor_id = auth.uid() and m.status = 'active'))
  )
$$;

-- ─── Notifications (insertion réservée aux fonctions du serveur) ────────
create function public.notify(p_user uuid, p_type public.notification_type, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user, p_type, p_title, p_body, p_link)
$$;
revoke execute on function public.notify(uuid, public.notification_type, text, text, text) from public, anon, authenticated;

create function public.log_admin(p_action text, p_target_type text, p_target_id text, p_details jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.admin_activity_logs (admin_id, action, target_type, target_id, details)
  values (auth.uid(), p_action, p_target_type, p_target_id, coalesce(p_details, '{}'::jsonb))
$$;
revoke execute on function public.log_admin(text, text, text, jsonb) from public, anon, authenticated;

create function public.display_name(p_user uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce(nullif(trim(first_name || ' ' || last_name), ''), 'Un membre')
  from public.profiles where id = p_user
$$;

-- ─── Création du profil à l'inscription ─────────────────────────────────
-- Le rôle choisi à l'inscription (raw_user_meta_data.role) n'est accepté que
-- s'il vaut « mentor » ; toute autre valeur (y compris « admin ») donne
-- « mentee ». Les rôles d'administration ne s'obtiennent que par
-- admin_set_role().
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_role public.user_role := case when new.raw_user_meta_data ->> 'role' = 'mentor' then 'mentor' else 'mentee' end;
begin
  insert into public.profiles (id, role, first_name, last_name)
  values (
    new.id, v_role,
    left(coalesce(new.raw_user_meta_data ->> 'first_name', ''), 80),
    left(coalesce(new.raw_user_meta_data ->> 'last_name', ''), 80)
  );
  if v_role = 'mentor' then
    insert into public.mentor_profiles (user_id) values (new.id);
  else
    insert into public.mentee_profiles (user_id) values (new.id);
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Protection des colonnes sensibles ──────────────────────────────────
-- Un utilisateur peut modifier son profil, jamais son rôle ni sa suspension.
-- Exception : les sessions « serveur » (éditeur SQL de Supabase, service_role)
-- qui ne passent pas par les rôles anon / authenticated, ainsi que les fonctions
-- SECURITY DEFINER de ce fichier (elles vérifient elles-mêmes l'appelant). C'est ainsi que l'on
-- crée le premier super administrateur (voir README).
create function public.is_trusted_backend() returns boolean
language sql stable set search_path = '' as $$
  select current_user not in ('anon', 'authenticated')
$$;

create function public.protect_profile_columns() returns trigger
language plpgsql set search_path = '' as $$
begin
  if public.is_trusted_backend() then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'Le rôle ne peut être modifié que par un super administrateur.' using errcode = '42501';
  end if;
  if (new.is_suspended is distinct from old.is_suspended or new.is_demo is distinct from old.is_demo)
     and not public.is_admin() then
    raise exception 'Modification réservée à l''administration.' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_columns();

create function public.protect_mentor_verification() returns trigger
language plpgsql set search_path = '' as $$
begin
  if public.is_trusted_backend() then
    return new;
  end if;
  if (new.verification_status is distinct from old.verification_status
      or new.verified_at is distinct from old.verified_at
      or new.verified_by is distinct from old.verified_by
      or new.rejection_reason is distinct from old.rejection_reason) then
    raise exception 'La vérification des mentors est réservée à l''administration.' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger mentor_profiles_protect before update on public.mentor_profiles
  for each row execute function public.protect_mentor_verification();

-- ─── Demandes de mentorat ───────────────────────────────────────────────
create function public.on_request_created() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.notify(new.mentor_id, 'request_received', 'Nouvelle demande de mentorat',
    public.display_name(new.mentee_id) || ' souhaite être accompagné(e) par vous.', '/mentor/demandes');
  return new;
end $$;
create trigger mentor_requests_notify after insert on public.mentor_requests
  for each row execute function public.on_request_created();

-- Le mentor accepte ou refuse. En cas d'acceptation : création du mentorat
-- et de sa conversation privée. Renvoie l'identifiant du mentorat (ou null).
create function public.respond_to_request(p_request_id uuid, p_accept boolean, p_message text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  r public.mentor_requests;
  v_mentorship uuid;
  v_conversation uuid;
  v_active int;
  v_max int;
begin
  select * into r from public.mentor_requests where id = p_request_id for update;
  if not found or r.mentor_id <> auth.uid() then
    raise exception 'Demande introuvable.' using errcode = 'P0002';
  end if;
  if r.status <> 'pending' then
    raise exception 'Cette demande a déjà été traitée.' using errcode = 'P0001';
  end if;

  if not p_accept then
    update public.mentor_requests
      set status = 'refused', response_message = left(p_message, 1000), responded_at = now()
      where id = r.id;
    perform public.notify(r.mentee_id, 'request_refused', 'Demande de mentorat refusée',
      public.display_name(r.mentor_id) || ' ne peut pas vous accompagner pour le moment.', '/mentore/demandes');
    return null;
  end if;

  select count(*) into v_active from public.mentorships where mentor_id = r.mentor_id and status = 'active';
  select max_mentees into v_max from public.mentor_profiles where user_id = r.mentor_id;
  if v_active >= coalesce(v_max, 5) then
    raise exception 'Vous avez atteint votre nombre maximal de mentorés actifs (%).', v_max using errcode = 'P0001';
  end if;

  update public.mentor_requests
    set status = 'accepted', response_message = left(p_message, 1000), responded_at = now()
    where id = r.id;

  insert into public.mentorships (request_id, mentor_id, mentee_id)
    values (r.id, r.mentor_id, r.mentee_id) returning id into v_mentorship;
  insert into public.conversations (mentorship_id) values (v_mentorship) returning id into v_conversation;
  insert into public.conversation_members (conversation_id, user_id)
    values (v_conversation, r.mentor_id), (v_conversation, r.mentee_id);

  perform public.notify(r.mentee_id, 'request_accepted', 'Demande acceptée 🎉',
    public.display_name(r.mentor_id) || ' a accepté de vous accompagner.', '/mentore/mentorats/' || v_mentorship);
  return v_mentorship;
end $$;

create function public.cancel_request(p_request_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.mentor_requests;
begin
  select * into r from public.mentor_requests where id = p_request_id for update;
  if not found or r.mentee_id <> auth.uid() then
    raise exception 'Demande introuvable.' using errcode = 'P0002';
  end if;
  if r.status <> 'pending' then
    raise exception 'Seule une demande en attente peut être annulée.' using errcode = 'P0001';
  end if;
  update public.mentor_requests set status = 'cancelled' where id = r.id;
  perform public.notify(r.mentor_id, 'request_cancelled', 'Demande annulée',
    public.display_name(r.mentee_id) || ' a annulé sa demande de mentorat.', '/mentor/demandes');
end $$;

-- Clôture d'un mentorat par l'un des deux participants.
create function public.complete_mentorship(p_mentorship_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare m public.mentorships; v_other uuid;
begin
  select * into m from public.mentorships where id = p_mentorship_id for update;
  if not found or auth.uid() not in (m.mentor_id, m.mentee_id) then
    raise exception 'Mentorat introuvable.' using errcode = 'P0002';
  end if;
  if m.status <> 'active' then
    raise exception 'Ce mentorat est déjà clôturé.' using errcode = 'P0001';
  end if;
  update public.mentorships set status = 'completed', ended_at = now() where id = m.id;
  update public.mentor_requests set status = 'completed' where id = m.request_id;
  -- Les rendez-vous futurs non réalisés sont annulés et leurs créneaux libérés.
  update public.availability_slots s set is_booked = false
    from public.appointments a
    where a.slot_id = s.id and a.mentorship_id = m.id and a.status in ('pending', 'confirmed') and a.starts_at > now();
  update public.appointments set status = 'cancelled', cancel_reason = 'Mentorat clôturé', cancelled_by = auth.uid()
    where mentorship_id = m.id and status in ('pending', 'confirmed') and starts_at > now();
  v_other := case when auth.uid() = m.mentor_id then m.mentee_id else m.mentor_id end;
  perform public.notify(v_other, 'mentorship_completed', 'Mentorat terminé',
    public.display_name(auth.uid()) || ' a clôturé le mentorat. Merci pour ce parcours !',
    case when v_other = m.mentee_id then '/mentore/mentorats/' else '/mentor/mentorats/' end || m.id);
end $$;

-- ─── Rendez-vous ────────────────────────────────────────────────────────
-- Le mentoré réserve un créneau libre de son mentor.
create function public.book_appointment(p_slot_id uuid, p_mentorship_id uuid, p_session_type public.session_type, p_topic text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  m public.mentorships;
  s public.availability_slots;
  v_id uuid;
begin
  select * into m from public.mentorships where id = p_mentorship_id;
  if not found or m.mentee_id <> auth.uid() then
    raise exception 'Mentorat introuvable.' using errcode = 'P0002';
  end if;
  if m.status <> 'active' then
    raise exception 'Ce mentorat n''est plus actif.' using errcode = 'P0001';
  end if;
  select * into s from public.availability_slots where id = p_slot_id for update;
  if not found or s.mentor_id <> m.mentor_id then
    raise exception 'Créneau introuvable.' using errcode = 'P0002';
  end if;
  if s.is_booked then
    raise exception 'Ce créneau vient d''être réservé. Choisissez-en un autre.' using errcode = 'P0001';
  end if;
  if s.starts_at <= now() then
    raise exception 'Ce créneau est déjà passé.' using errcode = 'P0001';
  end if;
  if not (p_session_type = any (s.session_types)) then
    raise exception 'Ce type de séance n''est pas proposé sur ce créneau.' using errcode = 'P0001';
  end if;

  update public.availability_slots set is_booked = true where id = s.id;
  insert into public.appointments (mentorship_id, slot_id, mentor_id, mentee_id, starts_at, ends_at, session_type, topic)
    values (m.id, s.id, m.mentor_id, m.mentee_id, s.starts_at, s.ends_at, p_session_type, left(p_topic, 300))
    returning id into v_id;
  perform public.notify(m.mentor_id, 'appointment_requested', 'Nouvelle réservation de séance',
    public.display_name(m.mentee_id) || ' a réservé un créneau. Confirmez-le.', '/mentor/rendez-vous');
  return v_id;
end $$;

create function public.confirm_appointment(p_appointment_id uuid, p_location_or_link text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare a public.appointments;
begin
  select * into a from public.appointments where id = p_appointment_id for update;
  if not found or a.mentor_id <> auth.uid() then
    raise exception 'Rendez-vous introuvable.' using errcode = 'P0002';
  end if;
  if a.status <> 'pending' then
    raise exception 'Ce rendez-vous n''est pas en attente de confirmation.' using errcode = 'P0001';
  end if;
  update public.appointments
    set status = 'confirmed', location_or_link = coalesce(nullif(left(p_location_or_link, 500), ''), location_or_link)
    where id = a.id;
  perform public.notify(a.mentee_id, 'appointment_confirmed', 'Séance confirmée',
    public.display_name(a.mentor_id) || ' a confirmé votre séance.', '/mentore/rendez-vous');
end $$;

create function public.cancel_appointment(p_appointment_id uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare a public.appointments; v_other uuid;
begin
  select * into a from public.appointments where id = p_appointment_id for update;
  if not found or auth.uid() not in (a.mentor_id, a.mentee_id) then
    raise exception 'Rendez-vous introuvable.' using errcode = 'P0002';
  end if;
  if a.status not in ('pending', 'confirmed') then
    raise exception 'Ce rendez-vous ne peut plus être annulé.' using errcode = 'P0001';
  end if;
  update public.appointments
    set status = 'cancelled', cancel_reason = left(p_reason, 500), cancelled_by = auth.uid()
    where id = a.id;
  if a.slot_id is not null and a.starts_at > now() then
    update public.availability_slots set is_booked = false where id = a.slot_id;
  end if;
  v_other := case when auth.uid() = a.mentor_id then a.mentee_id else a.mentor_id end;
  perform public.notify(v_other, 'appointment_cancelled', 'Séance annulée',
    public.display_name(auth.uid()) || ' a annulé une séance' || coalesce(' : ' || nullif(left(p_reason, 200), ''), '.'),
    case when v_other = a.mentee_id then '/mentore/rendez-vous' else '/mentor/rendez-vous' end);
end $$;

-- Reprogrammation par le mentoré : l'ancien rendez-vous est annulé, un nouveau
-- est créé sur le créneau choisi et garde la trace de l'ancien.
create function public.reschedule_appointment(p_appointment_id uuid, p_new_slot_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare a public.appointments; v_new uuid;
begin
  select * into a from public.appointments where id = p_appointment_id for update;
  if not found or a.mentee_id <> auth.uid() then
    raise exception 'Rendez-vous introuvable.' using errcode = 'P0002';
  end if;
  if a.status not in ('pending', 'confirmed') then
    raise exception 'Ce rendez-vous ne peut plus être reprogrammé.' using errcode = 'P0001';
  end if;
  v_new := public.book_appointment(p_new_slot_id, a.mentorship_id, a.session_type, a.topic);
  update public.appointments set rescheduled_from = a.id where id = v_new;
  update public.appointments set status = 'cancelled', cancel_reason = 'Reprogrammé', cancelled_by = auth.uid() where id = a.id;
  if a.slot_id is not null then
    update public.availability_slots set is_booked = false where id = a.slot_id;
  end if;
  return v_new;
end $$;

-- Le mentor marque une séance comme réalisée et peut y ajouter ses notes.
create function public.complete_appointment(p_appointment_id uuid, p_notes text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare a public.appointments;
begin
  select * into a from public.appointments where id = p_appointment_id for update;
  if not found or a.mentor_id <> auth.uid() then
    raise exception 'Rendez-vous introuvable.' using errcode = 'P0002';
  end if;
  if a.status <> 'confirmed' then
    raise exception 'Seule une séance confirmée peut être marquée comme réalisée.' using errcode = 'P0001';
  end if;
  if a.starts_at > now() then
    raise exception 'La séance n''a pas encore commencé.' using errcode = 'P0001';
  end if;
  update public.appointments set status = 'completed', mentor_notes = left(p_notes, 3000) where id = a.id;
end $$;

-- Rappels : à planifier toutes les 15 minutes avec pg_cron (voir README).
create function public.send_session_reminders() returns integer
language plpgsql security definer set search_path = '' as $$
declare a record; n integer := 0;
begin
  for a in
    select * from public.appointments
    where status = 'confirmed' and reminder_sent_at is null
      and starts_at between now() and now() + interval '24 hours'
    for update skip locked
  loop
    perform public.notify(a.mentee_id, 'session_reminder', 'Rappel : séance dans moins de 24 h', a.topic, '/mentore/rendez-vous');
    perform public.notify(a.mentor_id, 'session_reminder', 'Rappel : séance dans moins de 24 h', a.topic, '/mentor/rendez-vous');
    update public.appointments set reminder_sent_at = now() where id = a.id;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function public.send_session_reminders() from public, anon, authenticated;

-- ─── Objectifs : progression calculée à partir des étapes ───────────────
create function public.set_milestone_done_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.is_done is distinct from old.is_done then
    new.done_at := case when new.is_done then now() else null end;
  end if;
  return new;
end $$;
create trigger milestones_done_at before insert or update on public.goal_milestones
  for each row execute function public.set_milestone_done_at();

create function public.recompute_goal() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_goal uuid := coalesce(new.goal_id, old.goal_id);
  v_total int; v_done int;
  g public.mentorship_goals;
  v_status public.goal_status;
  v_mentor uuid;
begin
  select * into g from public.mentorship_goals where id = v_goal;
  if not found or g.status = 'abandoned' then return null; end if;
  select count(*), count(*) filter (where is_done) into v_total, v_done from public.goal_milestones where goal_id = v_goal;
  v_status := case when v_total > 0 and v_done = v_total then 'completed'
                   when v_done > 0 then 'in_progress' else 'not_started' end;
  if v_status is distinct from g.status then
    update public.mentorship_goals
      set status = v_status, completed_at = case when v_status = 'completed' then now() else null end
      where id = v_goal;
    if v_status = 'completed' then
      perform public.notify(g.mentee_id, 'goal_completed', 'Objectif atteint 🎯', g.title, '/mentore/objectifs/' || g.id);
      select mentor_id into v_mentor from public.mentorships where id = g.mentorship_id;
      if v_mentor is not null then
        perform public.notify(v_mentor, 'goal_completed', 'Un de vos mentorés a atteint un objectif',
          public.display_name(g.mentee_id) || ' : ' || g.title, '/mentor/mentorats/' || g.mentorship_id);
      end if;
    end if;
  end if;
  return null;
end $$;
create trigger milestones_recompute after insert or update or delete on public.goal_milestones
  for each row execute function public.recompute_goal();

create function public.on_goal_comment() returns trigger
language plpgsql security definer set search_path = '' as $$
declare g public.mentorship_goals;
begin
  select * into g from public.mentorship_goals where id = new.goal_id;
  if new.author_id <> g.mentee_id then
    perform public.notify(g.mentee_id, 'goal_comment', 'Nouveau commentaire sur un objectif',
      public.display_name(new.author_id) || ' a commenté « ' || g.title || ' ».', '/mentore/objectifs/' || g.id);
  end if;
  return new;
end $$;
create trigger goal_comments_notify after insert on public.goal_comments
  for each row execute function public.on_goal_comment();

-- ─── Messagerie ─────────────────────────────────────────────────────────
create function public.on_message_created() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_member record; v_link text;
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  update public.conversation_members set last_read_at = new.created_at
    where conversation_id = new.conversation_id and user_id = new.sender_id;
  for v_member in
    select cm.user_id, p.role from public.conversation_members cm join public.profiles p on p.id = cm.user_id
    where cm.conversation_id = new.conversation_id and cm.user_id <> new.sender_id
  loop
    v_link := case when v_member.role = 'mentor' then '/mentor/messages/' else '/mentore/messages/' end || new.conversation_id;
    -- Une seule notification non lue par conversation, pour ne pas inonder.
    if not exists (select 1 from public.notifications
                   where user_id = v_member.user_id and type = 'new_message' and link = v_link and read_at is null) then
      perform public.notify(v_member.user_id, 'new_message', 'Nouveau message', public.display_name(new.sender_id), v_link);
    end if;
  end loop;
  return new;
end $$;
create trigger messages_after_insert after insert on public.messages
  for each row execute function public.on_message_created();

create function public.mark_conversation_read(p_conversation uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.conversation_members set last_read_at = now()
    where conversation_id = p_conversation and user_id = auth.uid();
  update public.notifications set read_at = now()
    where user_id = auth.uid() and type = 'new_message' and read_at is null
      and link like '%/messages/' || p_conversation::text;
end $$;

-- ─── Publications : notifier les mentorés intéressés par le domaine ─────
create function public.on_opportunity_published() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.is_published and (tg_op = 'INSERT' or not old.is_published) then
    insert into public.notifications (user_id, type, title, body, link)
    select p.id, 'opportunity_published', 'Nouvelle opportunité : ' || left(new.title, 120), new.organization, '/mentore/opportunites'
    from public.profiles p
    where p.role = 'mentee' and not p.is_suspended
      and (new.domain_id is null or exists (select 1 from public.user_domains ud where ud.user_id = p.id and ud.domain_id = new.domain_id));
  end if;
  return new;
end $$;
create trigger opportunities_notify after insert or update of is_published on public.opportunities
  for each row execute function public.on_opportunity_published();

create function public.on_resource_published() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.is_published and new.domain_id is not null and (tg_op = 'INSERT' or not old.is_published) then
    insert into public.notifications (user_id, type, title, body, link)
    select ud.user_id, 'resource_published', 'Nouvelle ressource : ' || left(new.title, 120), null, '/mentore/ressources'
    from public.user_domains ud join public.profiles p on p.id = ud.user_id
    where ud.domain_id = new.domain_id and p.role = 'mentee' and p.id is distinct from new.author_id;
  end if;
  return new;
end $$;
create trigger resources_notify after insert or update of is_published on public.resources
  for each row execute function public.on_resource_published();

-- ─── Administration ─────────────────────────────────────────────────────
create function public.admin_verify_mentor(p_user_id uuid, p_approve boolean, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Action réservée à l''administration.' using errcode = '42501';
  end if;
  update public.mentor_profiles
    set verification_status = case when p_approve then 'verified' else 'rejected' end::public.verification_status,
        verified_at = case when p_approve then now() else null end,
        verified_by = auth.uid(),
        rejection_reason = case when p_approve then null else left(p_reason, 500) end
    where user_id = p_user_id;
  if not found then
    raise exception 'Profil mentor introuvable.' using errcode = 'P0002';
  end if;
  if p_approve then
    perform public.notify(p_user_id, 'mentor_verified', 'Profil mentor vérifié ✅',
      'Votre profil est désormais visible des mentorés.', '/mentor');
  else
    perform public.notify(p_user_id, 'mentor_rejected', 'Profil mentor non validé',
      coalesce(left(p_reason, 300), 'Complétez votre profil puis contactez l''administration.'), '/mentor/profil');
  end if;
  perform public.log_admin(case when p_approve then 'mentor.verify' else 'mentor.reject' end, 'user', p_user_id::text,
    jsonb_build_object('reason', p_reason));
end $$;

-- Changement de rôle : réservé aux super administrateurs.
create function public.admin_set_role(p_user_id uuid, p_role public.user_role)
returns void language plpgsql security definer set search_path = '' as $$
declare v_old public.user_role;
begin
  if not public.is_super_admin() then
    raise exception 'Seul un super administrateur peut attribuer un rôle.' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Vous ne pouvez pas modifier votre propre rôle.' using errcode = 'P0001';
  end if;
  select role into v_old from public.profiles where id = p_user_id;
  if not found then
    raise exception 'Utilisateur introuvable.' using errcode = 'P0002';
  end if;
  update public.profiles set role = p_role where id = p_user_id;
  if p_role = 'mentor' then
    insert into public.mentor_profiles (user_id) values (p_user_id) on conflict do nothing;
  elsif p_role = 'mentee' then
    insert into public.mentee_profiles (user_id) values (p_user_id) on conflict do nothing;
  end if;
  perform public.log_admin('user.set_role', 'user', p_user_id::text, jsonb_build_object('from', v_old, 'to', p_role));
end $$;

create function public.admin_set_suspended(p_user_id uuid, p_suspended boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_target public.user_role;
begin
  if not public.is_admin() then
    raise exception 'Action réservée à l''administration.' using errcode = '42501';
  end if;
  select role into v_target from public.profiles where id = p_user_id;
  if v_target in ('admin', 'super_admin') and not public.is_super_admin() then
    raise exception 'Seul un super administrateur peut suspendre un administrateur.' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Vous ne pouvez pas vous suspendre vous-même.' using errcode = 'P0001';
  end if;
  update public.profiles set is_suspended = p_suspended where id = p_user_id;
  perform public.log_admin(case when p_suspended then 'user.suspend' else 'user.unsuspend' end, 'user', p_user_id::text);
end $$;

create function public.admin_handle_report(p_report_id uuid, p_status public.report_status, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Action réservée à l''administration.' using errcode = '42501';
  end if;
  update public.reports
    set status = p_status, resolution_note = left(p_note, 1000), handled_by = auth.uid(), handled_at = now()
    where id = p_report_id;
  perform public.log_admin('report.' || p_status::text, 'report', p_report_id::text, jsonb_build_object('note', p_note));
end $$;

-- Liste des utilisateurs avec leur e-mail (lu dans auth.users) : admin seulement.
create function public.admin_list_users(p_search text default null, p_role public.user_role default null,
                                        p_limit int default 20, p_offset int default 0)
returns table (id uuid, email text, role public.user_role, first_name text, last_name text, is_suspended boolean,
               is_demo boolean, verification_status public.verification_status, created_at timestamptz, total bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Action réservée à l''administration.' using errcode = '42501';
  end if;
  return query
    select p.id, u.email::text, p.role, p.first_name, p.last_name, p.is_suspended, p.is_demo,
           mp.verification_status, p.created_at, count(*) over ()
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.mentor_profiles mp on mp.user_id = p.id
    where (p_role is null or p.role = p_role)
      and (p_search is null or p_search = ''
           or (p.first_name || ' ' || p.last_name || ' ' || coalesce(u.email, '')) ilike '%' || p_search || '%')
    order by p.created_at desc
    limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
end $$;

create function public.admin_overview() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Action réservée à l''administration.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'mentors', (select count(*) from public.profiles where role = 'mentor'),
    'mentees', (select count(*) from public.profiles where role = 'mentee'),
    'mentors_pending', (select count(*) from public.mentor_profiles mp join public.profiles p on p.id = mp.user_id
                        where p.role = 'mentor' and mp.verification_status = 'pending'),
    'mentorships_active', (select count(*) from public.mentorships where status = 'active'),
    'sessions_completed', (select count(*) from public.appointments where status = 'completed'),
    'requests_pending', (select count(*) from public.mentor_requests where status = 'pending'),
    'resources', (select count(*) from public.resources),
    'opportunities', (select count(*) from public.opportunities),
    'reports_open', (select count(*) from public.reports where status in ('open', 'reviewing'))
  );
end $$;

-- ─── Statistiques publiques (page d'accueil) : uniquement des totaux ────
create function public.public_stats() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'mentors', (select count(*) from public.mentor_profiles mp join public.profiles p on p.id = mp.user_id
                where mp.verification_status = 'verified' and p.role = 'mentor' and not p.is_suspended),
    'mentees', (select count(*) from public.profiles where role = 'mentee'),
    'mentorships', (select count(*) from public.mentorships),
    'sessions', (select count(*) from public.appointments where status = 'completed'),
    'domains', (select count(*) from public.expertise_domains)
  )
$$;
grant execute on function public.public_stats() to anon, authenticated;

-- Note moyenne publique d'un mentor
create function public.mentor_rating(p_mentor uuid) returns table (average numeric, count bigint)
language sql stable security definer set search_path = '' as $$
  select round(avg(rating)::numeric, 1), count(*) from public.reviews where mentor_id = p_mentor and not is_hidden
$$;
grant execute on function public.mentor_rating(uuid) to anon, authenticated;

-- Fonctions réservées aux utilisateurs connectés
revoke execute on function public.respond_to_request(uuid, boolean, text) from public, anon;
revoke execute on function public.cancel_request(uuid) from public, anon;
revoke execute on function public.complete_mentorship(uuid) from public, anon;
revoke execute on function public.book_appointment(uuid, uuid, public.session_type, text) from public, anon;
revoke execute on function public.confirm_appointment(uuid, text) from public, anon;
revoke execute on function public.cancel_appointment(uuid, text) from public, anon;
revoke execute on function public.reschedule_appointment(uuid, uuid) from public, anon;
revoke execute on function public.complete_appointment(uuid, text) from public, anon;
revoke execute on function public.mark_conversation_read(uuid) from public, anon;
revoke execute on function public.admin_verify_mentor(uuid, boolean, text) from public, anon;
revoke execute on function public.admin_set_role(uuid, public.user_role) from public, anon;
revoke execute on function public.admin_set_suspended(uuid, boolean) from public, anon;
revoke execute on function public.admin_handle_report(uuid, public.report_status, text) from public, anon;
revoke execute on function public.admin_list_users(text, public.user_role, int, int) from public, anon;
revoke execute on function public.admin_overview() from public, anon;
grant execute on function public.respond_to_request(uuid, boolean, text), public.cancel_request(uuid),
  public.complete_mentorship(uuid), public.book_appointment(uuid, uuid, public.session_type, text),
  public.confirm_appointment(uuid, text), public.cancel_appointment(uuid, text),
  public.reschedule_appointment(uuid, uuid), public.complete_appointment(uuid, text),
  public.mark_conversation_read(uuid), public.admin_verify_mentor(uuid, boolean, text),
  public.admin_set_role(uuid, public.user_role), public.admin_set_suspended(uuid, boolean),
  public.admin_handle_report(uuid, public.report_status, text),
  public.admin_list_users(text, public.user_role, int, int), public.admin_overview()
  to authenticated;
