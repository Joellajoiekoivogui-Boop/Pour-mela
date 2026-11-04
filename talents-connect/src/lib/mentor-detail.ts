import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { listVerifiedMentors } from "@/lib/queries";
import type { PublicReview } from "@/components/shared/mentor-profile-view";

/** Mentor vérifié et ses avis visibles, ou null s'il n'existe pas / n'est pas vérifié. */
export async function getMentorDetail(supabase: SupabaseClient, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [items, reviews] = await Promise.all([
    listVerifiedMentors(supabase, { ids: [id], limit: 1 }),
    supabase.from("reviews").select("id, rating, comment, created_at").eq("mentor_id", id).eq("is_hidden", false).order("created_at", { ascending: false }).limit(20),
  ]);
  const item = items[0];
  if (!item) return null;
  return { item, reviews: (reviews.data ?? []) as PublicReview[] };
}
