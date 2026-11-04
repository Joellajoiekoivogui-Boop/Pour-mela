import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasEnoughNeeds, rankMentors, type MatchResult } from "@/lib/matching/engine";
import { getCatalog, getMenteeNeeds, listVerifiedMentors, toCandidate, toCatalog, type MentorListItem } from "@/lib/queries";

export interface Recommendation { item: MentorListItem; match: MatchResult }

/**
 * Recommandations de mentors pour un mentoré : charge ses besoins, les
 * mentors vérifiés, puis applique le moteur de matching (déterministe).
 */
export async function getRecommendations(supabase: SupabaseClient, userId: string, opts: { domainId?: number; search?: string; limit?: number } = {}) {
  const [{ needs }, mentors, { domains, skills }] = await Promise.all([
    getMenteeNeeds(supabase, userId),
    listVerifiedMentors(supabase, { domainId: opts.domainId, search: opts.search, limit: 200 }),
    getCatalog(),
  ]);
  const catalog = toCatalog(domains, skills);
  const byId = new Map(mentors.map((m) => [m.profile.id, m]));
  const ranked = rankMentors(needs, mentors.map(toCandidate), catalog);
  const results: Recommendation[] = ranked.slice(0, opts.limit ?? ranked.length).map((match) => ({ item: byId.get(match.mentorId)!, match }));
  return { results, needs, enough: hasEnoughNeeds(needs), catalog, domains };
}
