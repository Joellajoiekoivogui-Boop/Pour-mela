import "server-only";
import type { Session } from "@/lib/auth";
import { EDUCATION_LEVELS } from "@/lib/labels";
import { getCatalog } from "@/lib/queries";
import { fallbackAnswer, fallbackPath } from "./fallback";
import { AiError, complete, isAiConfigured, type ChatMessage } from "./provider";
import { systemPrompt, type AssistantMode } from "./prompts";

export interface AssistantReply {
  text: string;
  /** « ai » : réponse du modèle ; « fallback » : modèle prédéfini (sans IA). */
  source: "ai" | "fallback";
  plan?: { title: string; steps: string[]; advice?: string };
  notice?: string;
}

const dailyLimit = () => Math.max(1, Number(process.env.AI_DAILY_LIMIT) || 30);

/** Contexte du profil transmis au modèle : jamais le nom ni l'e-mail. */
async function profileContext(session: Session): Promise<string> {
  const { supabase, user, profile } = session;
  const [{ domains, skills }, ud, us] = await Promise.all([
    getCatalog(),
    supabase.from("user_domains").select("domain_id").eq("user_id", user.id),
    supabase.from("user_skills").select("skill_id, relation").eq("user_id", user.id),
  ]);
  const dn = new Map(domains.map((d) => [d.id, d.name]));
  const sn = new Map(skills.map((s) => [s.id, s.name]));
  const userSkills = (us.data ?? []) as { skill_id: number; relation: string }[];
  const lines = [`Rôle : ${profile.role === "mentor" ? "mentor (professionnel)" : "mentoré (jeune talent)"}`];
  const doms = ((ud.data ?? []) as { domain_id: number }[]).map((d) => dn.get(d.domain_id)).filter(Boolean);
  if (doms.length) lines.push(`Domaines : ${doms.join(", ")}`);
  const pick = (rel: string) => userSkills.filter((s) => s.relation === rel).map((s) => sn.get(s.skill_id)).filter(Boolean).join(", ");
  if (profile.role === "mentor") {
    const { data } = await supabase.from("mentor_profiles").select("job_title, years_experience").eq("user_id", user.id).maybeSingle<{ job_title: string | null; years_experience: number }>();
    if (data?.job_title) lines.push(`Poste : ${data.job_title} (${data.years_experience} ans d'expérience)`);
    if (pick("teaches")) lines.push(`Compétences transmises : ${pick("teaches")}`);
  } else {
    const { data } = await supabase.from("mentee_profiles").select("education_level, field_of_study, professional_goals, project_needs").eq("user_id", user.id).maybeSingle<{ education_level: string | null; field_of_study: string | null; professional_goals: string | null; project_needs: string | null }>();
    if (data?.education_level) lines.push(`Niveau d'études : ${EDUCATION_LEVELS[data.education_level] ?? data.education_level}`);
    if (data?.field_of_study) lines.push(`Formation : ${data.field_of_study}`);
    if (data?.professional_goals) lines.push(`Objectifs : ${data.professional_goals.slice(0, 600)}`);
    if (data?.project_needs) lines.push(`Projet : ${data.project_needs.slice(0, 400)}`);
    if (pick("has")) lines.push(`Compétences actuelles : ${pick("has")}`);
    if (pick("wants")) lines.push(`Compétences recherchées : ${pick("wants")}`);
  }
  if (profile.location) lines.push(`Localisation : ${profile.location}`);
  return lines.join("\n");
}

function parsePlan(text: string): AssistantReply["plan"] | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[0]) as { title?: unknown; steps?: unknown; advice?: unknown };
    if (typeof data.title !== "string" || !Array.isArray(data.steps)) return null;
    const steps = data.steps.filter((s): s is string => typeof s === "string" && s.trim().length > 1).map((s) => s.trim().slice(0, 200)).slice(0, 12);
    if (steps.length < 2) return null;
    return { title: data.title.trim().slice(0, 160), steps, advice: typeof data.advice === "string" ? data.advice.slice(0, 400) : undefined };
  } catch {
    return null;
  }
}

function fallbackReply(mode: AssistantMode, question: string, notice: string): AssistantReply {
  if (mode === "path") {
    const plan = fallbackPath(question);
    return { source: "fallback", notice, plan, text: `Voici un parcours type pour « ${plan.title} ». ${plan.advice}` };
  }
  return { source: "fallback", notice, text: fallbackAnswer(mode, question) };
}

export async function runAssistant(session: Session, mode: AssistantMode, messages: ChatMessage[]): Promise<AssistantReply> {
  const question = messages.at(-1)?.content ?? "";
  if (!isAiConfigured()) return fallbackReply(mode, question, "Mode sans IA : aucune clé d'API n'est configurée, la réponse provient d'un modèle prédéfini.");

  // Limite d'utilisation par utilisateur sur 24 h (comptée en base).
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count } = await session.supabase.from("ai_usage").select("id", { count: "exact", head: true }).eq("user_id", session.user.id).gte("created_at", since);
  if ((count ?? 0) >= dailyLimit()) return fallbackReply(mode, question, `Limite quotidienne de ${dailyLimit()} requêtes IA atteinte : réponse issue d'un modèle prédéfini. Réessayez demain.`);

  try {
    const context = await profileContext(session);
    const text = await complete({ system: systemPrompt(mode, context), messages: messages.slice(-10), maxTokens: mode === "path" ? 900 : 1400 });
    await session.supabase.from("ai_usage").insert({ user_id: session.user.id, mode });
    if (!text) return fallbackReply(mode, question, "Réponse vide du service d'IA : modèle prédéfini utilisé.");
    if (mode === "path") {
      const plan = parsePlan(text);
      if (!plan) return fallbackReply(mode, question, "Le plan généré était illisible : parcours type utilisé.");
      return { source: "ai", plan, text: plan.advice ?? "Voici un parcours proposé. Ajustez-le avec votre mentor." };
    }
    return { source: "ai", text };
  } catch (e) {
    const reason = e instanceof AiError ? e.message : "Service d'IA indisponible.";
    console.warn("[ai]", reason);
    return fallbackReply(mode, question, `${reason} Réponse issue d'un modèle prédéfini.`);
  }
}
