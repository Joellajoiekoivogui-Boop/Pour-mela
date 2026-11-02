"use client";

import { getBrowserSupabase } from "../supabase/client";
import type { ProgressEvent } from "./engine";
import { emptyProgress, type ProgressState } from "./types";

// Synchronisation de la progression avec Supabase (utilisateurs connectés).
// Chaque table est protégée par RLS : un utilisateur ne voit et n'écrit que
// ses propres lignes (user_id = auth.uid()).

export async function currentUserId(): Promise<string | null> {
  const sb = getBrowserSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user?.id ?? null;
}

export async function pushEvent(userId: string, ev: ProgressEvent, state: ProgressState, newBadges: string[]) {
  const sb = getBrowserSupabase();
  if (!sb) return;
  const ops: PromiseLike<unknown>[] = [];
  switch (ev.type) {
    case "setProfile":
      ops.push(sb.from("profiles").update({ pseudo: ev.profile.pseudo, avatar: ev.profile.avatar, age_group: ev.profile.ageGroup }).eq("id", userId));
      break;
    case "discoverCountry":
      ops.push(sb.from("country_discoveries").upsert({ user_id: userId, country_code: ev.code }, { onConflict: "user_id,country_code", ignoreDuplicates: true }));
      break;
    case "readArticle":
      ops.push(sb.from("reading_history").upsert({ user_id: userId, article_slug: ev.slug, completed: true }, { onConflict: "user_id,article_slug" }));
      break;
    case "completeStory":
      ops.push(sb.from("user_progress").upsert({ user_id: userId, item_type: "story", item_slug: ev.slug, data: { ending: ev.ending } }, { onConflict: "user_id,item_type,item_slug" }));
      break;
    case "recordQuiz": {
      const r = state.quizResults[ev.slug];
      ops.push(sb.from("user_progress").upsert({ user_id: userId, item_type: "quiz", item_slug: ev.slug, score: r.best, total: r.total, attempts: r.attempts }, { onConflict: "user_id,item_type,item_slug" }));
      break;
    }
    case "completeDaily":
      ops.push(sb.from("user_progress").upsert({ user_id: userId, item_type: "daily", item_slug: ev.day, score: ev.score, total: 3 }, { onConflict: "user_id,item_type,item_slug", ignoreDuplicates: true }));
      break;
    case "addReading":
      ops.push(sb.from("user_progress").upsert({ user_id: userId, item_type: "reading_time", item_slug: ev.day, score: state.readingSeconds[ev.day] ?? 0 }, { onConflict: "user_id,item_type,item_slug" }));
      break;
    case "reset":
      break;
  }
  if (newBadges.length) ops.push(sb.from("user_achievements").upsert(newBadges.map((b) => ({ user_id: userId, achievement_code: b })), { onConflict: "user_id,achievement_code", ignoreDuplicates: true }));
  await Promise.allSettled(ops);
}

/** Recharge la progression enregistrée dans le compte. */
export async function pullProgress(userId: string): Promise<ProgressState | null> {
  const sb = getBrowserSupabase();
  if (!sb) return null;
  const [profile, countries, reading, progress, badges] = await Promise.all([
    sb.from("profiles").select("pseudo, avatar, age_group").eq("id", userId).maybeSingle(),
    sb.from("country_discoveries").select("country_code, created_at").eq("user_id", userId),
    sb.from("reading_history").select("article_slug, updated_at").eq("user_id", userId).eq("completed", true),
    sb.from("user_progress").select("item_type, item_slug, score, total, attempts, data, updated_at").eq("user_id", userId),
    sb.from("user_achievements").select("achievement_code, created_at").eq("user_id", userId),
  ]);
  if (profile.error && countries.error) return null;
  const s = emptyProgress();
  if (profile.data?.pseudo) s.profile = { pseudo: profile.data.pseudo, avatar: profile.data.avatar ?? "awa", ageGroup: profile.data.age_group ?? "7-9" };
  for (const c of countries.data ?? []) s.countries[c.country_code] = c.created_at;
  for (const r of reading.data ?? []) s.articlesRead[r.article_slug] = r.updated_at;
  for (const b of badges.data ?? []) s.badges[b.achievement_code] = b.created_at;
  for (const p of progress.data ?? []) {
    if (p.item_type === "quiz") s.quizResults[p.item_slug] = { best: p.score ?? 0, total: p.total ?? 0, attempts: p.attempts ?? 1, lastAt: p.updated_at };
    if (p.item_type === "story") s.storiesDone[p.item_slug] = { at: p.updated_at, ending: (p.data as { ending?: string } | null)?.ending ?? "" };
    if (p.item_type === "daily") s.dailyDone[p.item_slug] = p.score ?? 0;
    if (p.item_type === "reading_time") s.readingSeconds[p.item_slug] = p.score ?? 0;
  }
  return s;
}

/** Envoie tout l'état local vers le compte (après connexion). */
export async function pushAll(userId: string, s: ProgressState) {
  const sb = getBrowserSupabase();
  if (!sb) return;
  const progressRows = [
    ...Object.entries(s.quizResults).map(([slug, r]) => ({ user_id: userId, item_type: "quiz", item_slug: slug, score: r.best, total: r.total, attempts: r.attempts, data: null })),
    ...Object.entries(s.storiesDone).map(([slug, r]) => ({ user_id: userId, item_type: "story", item_slug: slug, score: null, total: null, attempts: 1, data: { ending: r.ending } })),
    ...Object.entries(s.dailyDone).map(([day, score]) => ({ user_id: userId, item_type: "daily", item_slug: day, score, total: 3, attempts: 1, data: null })),
    ...Object.entries(s.readingSeconds).map(([day, secs]) => ({ user_id: userId, item_type: "reading_time", item_slug: day, score: secs, total: null, attempts: 1, data: null })),
  ];
  const ops: PromiseLike<unknown>[] = [];
  if (s.profile) ops.push(sb.from("profiles").update({ pseudo: s.profile.pseudo, avatar: s.profile.avatar, age_group: s.profile.ageGroup }).eq("id", userId));
  if (progressRows.length) ops.push(sb.from("user_progress").upsert(progressRows, { onConflict: "user_id,item_type,item_slug" }));
  const countries = Object.keys(s.countries).map((c) => ({ user_id: userId, country_code: c }));
  if (countries.length) ops.push(sb.from("country_discoveries").upsert(countries, { onConflict: "user_id,country_code", ignoreDuplicates: true }));
  const reads = Object.keys(s.articlesRead).map((slug) => ({ user_id: userId, article_slug: slug, completed: true }));
  if (reads.length) ops.push(sb.from("reading_history").upsert(reads, { onConflict: "user_id,article_slug" }));
  const badges = Object.keys(s.badges).map((b) => ({ user_id: userId, achievement_code: b }));
  if (badges.length) ops.push(sb.from("user_achievements").upsert(badges, { onConflict: "user_id,achievement_code", ignoreDuplicates: true }));
  await Promise.allSettled(ops);
}
