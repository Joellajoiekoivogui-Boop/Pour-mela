-- ════════════════════════════════════════════════════════════════════════
-- TALENTS CONNECT — Mécanismes d'apprentissage (voir docs/conception-comportementale.md)
--   • Intention de mise en œuvre sur une étape : « Quand…, je… »
--   • Ce que je retiens d'une séance (effet de génération) et révision espacée
--     (pratique de récupération), à J+2 puis tous les 7 jours.
-- ════════════════════════════════════════════════════════════════════════

alter table public.goal_milestones
  add column if not exists intention text check (char_length(intention) <= 300);

alter table public.appointments
  add column if not exists mentee_takeaways text check (char_length(mentee_takeaways) <= 1500),
  add column if not exists takeaways_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_count smallint not null default 0;

-- Le mentoré note ce qu'il retient d'une séance réalisée ; son mentor est prévenu.
create function public.save_session_takeaways(p_appointment_id uuid, p_text text)
returns void language plpgsql security definer set search_path = '' as $$
declare a public.appointments;
begin
  select * into a from public.appointments where id = p_appointment_id for update;
  if not found or a.mentee_id <> auth.uid() then
    raise exception 'Séance introuvable.' using errcode = 'P0002';
  end if;
  if a.status <> 'completed' then
    raise exception 'Vous pourrez noter ce que vous retenez une fois la séance réalisée.' using errcode = 'P0001';
  end if;
  if char_length(trim(coalesce(p_text, ''))) < 10 then
    raise exception 'Écrivez au moins une idée (10 caractères minimum).' using errcode = 'P0001';
  end if;
  update public.appointments
    set mentee_takeaways = left(trim(p_text), 1500), takeaways_at = coalesce(takeaways_at, now())
    where id = a.id;
  perform public.notify(a.mentor_id, 'goal_comment', 'Retour de séance',
    public.display_name(a.mentee_id) || ' a noté ce qu''il ou elle retient de votre séance.', '/mentor/mentorats/' || a.mentorship_id);
end $$;

-- Révision : le mentoré a essayé de se rappeler ses notes, puis les a relues.
create function public.mark_takeaways_reviewed(p_appointment_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.appointments set reviewed_at = now(), review_count = review_count + 1
    where id = p_appointment_id and mentee_id = auth.uid() and mentee_takeaways is not null;
  if not found then
    raise exception 'Séance introuvable.' using errcode = 'P0002';
  end if;
end $$;

revoke execute on function public.save_session_takeaways(uuid, text) from public, anon;
revoke execute on function public.mark_takeaways_reviewed(uuid) from public, anon;
grant execute on function public.save_session_takeaways(uuid, text), public.mark_takeaways_reviewed(uuid) to authenticated;
