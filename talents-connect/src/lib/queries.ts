import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Catalog, MenteeNeeds, MentorCandidate } from "@/lib/matching/engine";
import type { Domain, MenteeProfile, MentorProfile, PersonSummary, Profile, Skill } from "@/types/db";

/** Référentiels (domaines et compétences), lus une fois par requête. */
export const getCatalog = cache(async () => {
  const supabase = await getServerSupabase();
  if (!supabase) return { domains: [] as Domain[], skills: [] as Skill[] };
  const [d, s] = await Promise.all([
    supabase.from("expertise_domains").select("*").order("sort_order"),
    supabase.from("skills").select("*").order("name"),
  ]);
  return { domains: (d.data ?? []) as Domain[], skills: (s.data ?? []) as Skill[] };
});

export function toCatalog(domains: Domain[], skills: Skill[]): Catalog {
  const dn = new Map(domains.map((d) => [d.id, d.name]));
  const sn = new Map(skills.map((s) => [s.id, s]));
  return {
    domainName: (id) => dn.get(id),
    skillName: (id) => sn.get(id)?.name,
    skillDomain: (id) => sn.get(id)?.domain_id,
  };
}

export interface MentorListItem {
  profile: Pick<Profile, "id" | "first_name" | "last_name" | "avatar_url" | "location" | "bio" | "is_demo">;
  mentor: Pick<MentorProfile, "job_title" | "organization" | "years_experience" | "languages" | "support_types" | "availability_note" | "max_mentees" | "experiences" | "education">;
  domainIds: number[];
  skillIds: number[];
  activeMentees: number;
  freeSlots: number;
  rating: number | null;
  reviewCount: number;
}

type MentorRow = MentorListItem["mentor"] & { user_id: string; profile: MentorListItem["profile"] | null };

/**
 * Annuaire des mentors vérifiés (lisible par tous grâce aux politiques RLS).
 * Filtres facultatifs : domaine (slug) et recherche texte.
 */
export async function listVerifiedMentors(
  supabase: SupabaseClient,
  opts: { domainId?: number; search?: string; limit?: number; ids?: string[] } = {},
): Promise<MentorListItem[]> {
  let query = supabase
    .from("mentor_profiles")
    .select(
      "user_id, job_title, organization, years_experience, languages, support_types, availability_note, max_mentees, experiences, education, " +
        "profile:profiles!mentor_profiles_user_id_fkey!inner(id, first_name, last_name, avatar_url, location, bio, is_demo, role, is_suspended)",
    )
    .eq("verification_status", "verified")
    .eq("profile.role", "mentor")
    .eq("profile.is_suspended", false)
    .order("years_experience", { ascending: false })
    .limit(opts.limit ?? 60);
  if (opts.ids) query = query.in("user_id", opts.ids);
  const { data, error } = await query;
  if (error || !data) {
    if (error) console.error("[mentors]", error.message);
    return [];
  }
  let rows = (data as unknown as MentorRow[]).filter((r) => r.profile);
  const ids = rows.map((r) => r.user_id);
  if (ids.length === 0) return [];

  const [domains, skills, stats] = await Promise.all([
    supabase.from("user_domains").select("user_id, domain_id").in("user_id", ids),
    supabase.from("user_skills").select("user_id, skill_id").eq("relation", "teaches").in("user_id", ids),
    supabase.rpc("mentor_directory_stats", { p_ids: ids }),
  ]);
  const byUser = <T extends { user_id: string }>(list: T[] | null, pick: (t: T) => number) => {
    const map = new Map<string, number[]>();
    for (const item of list ?? []) map.set(item.user_id, [...(map.get(item.user_id) ?? []), pick(item)]);
    return map;
  };
  const domainMap = byUser(domains.data as { user_id: string; domain_id: number }[] | null, (x) => x.domain_id);
  const skillMap = byUser(skills.data as { user_id: string; skill_id: number }[] | null, (x) => x.skill_id);
  const statMap = new Map(
    ((stats.data ?? []) as { mentor_id: string; active_mentees: number; free_slots: number; rating: number | null; reviews: number }[])
      .map((s) => [s.mentor_id, s]),
  );

  if (opts.domainId) rows = rows.filter((r) => domainMap.get(r.user_id)?.includes(opts.domainId!));
  if (opts.search) {
    const q = opts.search.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    rows = rows.filter((r) =>
      [r.profile?.first_name, r.profile?.last_name, r.job_title, r.organization, r.profile?.bio, r.profile?.location]
        .filter(Boolean).join(" ").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().includes(q),
    );
  }

  return rows.map((r) => {
    const s = statMap.get(r.user_id);
    const { profile, ...mentor } = r;
    return {
      profile: profile!,
      mentor,
      domainIds: domainMap.get(r.user_id) ?? [],
      skillIds: skillMap.get(r.user_id) ?? [],
      activeMentees: Number(s?.active_mentees ?? 0),
      freeSlots: Number(s?.free_slots ?? 0),
      rating: s?.rating != null ? Number(s.rating) : null,
      reviewCount: Number(s?.reviews ?? 0),
    };
  });
}

export function toCandidate(m: MentorListItem): MentorCandidate {
  return {
    id: m.profile.id,
    domainIds: m.domainIds,
    skillIds: m.skillIds,
    jobTitle: m.mentor.job_title,
    organization: m.mentor.organization,
    bio: m.profile.bio,
    experiences: m.mentor.experiences,
    yearsExperience: m.mentor.years_experience,
    freeSlotCount: m.freeSlots,
    availabilityNote: m.mentor.availability_note,
    activeMentees: m.activeMentees,
    maxMentees: m.mentor.max_mentees,
  };
}

/** Besoins du mentoré connecté, lus dans son profil et ses objectifs. */
export async function getMenteeNeeds(supabase: SupabaseClient, userId: string): Promise<{ needs: MenteeNeeds; profile: MenteeProfile | null }> {
  const [mp, domains, wanted, goals] = await Promise.all([
    supabase.from("mentee_profiles").select("*").eq("user_id", userId).maybeSingle<MenteeProfile>(),
    supabase.from("user_domains").select("domain_id").eq("user_id", userId),
    supabase.from("user_skills").select("skill_id").eq("user_id", userId).eq("relation", "wants"),
    supabase.from("mentorship_goals").select("title, description").eq("mentee_id", userId).neq("status", "abandoned"),
  ]);
  const profile = mp.data ?? null;
  const goalsText = [
    profile?.professional_goals, profile?.project_needs, profile?.interests, profile?.field_of_study,
    ...((goals.data ?? []) as { title: string; description: string | null }[]).flatMap((g) => [g.title, g.description]),
  ].filter(Boolean).join(". ");
  return {
    profile,
    needs: {
      domainIds: ((domains.data ?? []) as { domain_id: number }[]).map((d) => d.domain_id),
      wantedSkillIds: ((wanted.data ?? []) as { skill_id: number }[]).map((s) => s.skill_id),
      goalsText,
    },
  };
}

export async function getPublicStats(): Promise<Record<"mentors" | "mentees" | "mentorships" | "sessions" | "domains", number> | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("public_stats");
  if (error || !data) return null;
  return data as Record<"mentors" | "mentees" | "mentorships" | "sessions" | "domains", number>;
}

export async function countUnreadNotifications(supabase: SupabaseClient, userId: string): Promise<number> {
  const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null);
  return count ?? 0;
}

/** Profils (nom, photo) d'une liste d'utilisateurs visibles par l'utilisateur courant. */
export async function getPeople(supabase: SupabaseClient, ids: (string | null | undefined)[]): Promise<Map<string, PersonSummary>> {
  const unique = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (unique.length === 0) return new Map();
  const { data } = await supabase.from("profiles").select("id, first_name, last_name, avatar_url").in("id", unique);
  return new Map(((data ?? []) as PersonSummary[]).map((p) => [p.id, p]));
}
