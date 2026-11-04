"use server";

import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/supabase/config";
import { homeForRole } from "@/lib/labels";
import { safeInternalPath } from "@/lib/utils";
import { emailSchema, resetPasswordSchema, signInSchema, signUpSchema } from "@/lib/validation/schemas";
import { fromZod, notConfigured, type ActionResult } from "./result";
import type { UserRole } from "@/types/db";

export async function signUpAction(input: unknown): Promise<ActionResult<{ needsConfirmation: boolean }>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const supabase = await getServerSupabase();
  if (!supabase) return notConfigured;

  const { email, password, firstName, lastName, role } = parsed.data;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/confirm?next=/espace`,
      // Le rôle n'est qu'une préférence : le déclencheur SQL n'accepte que
      // « mentor » ou « mentee » (jamais un rôle d'administration).
      data: { first_name: firstName, last_name: lastName, role },
    },
  });
  if (error) {
    if (error.code === "user_already_exists") return { ok: false, error: "Un compte existe déjà avec cette adresse." };
    if (error.code === "weak_password") return { ok: false, error: "Mot de passe trop faible." };
    if (error.status === 429) return { ok: false, error: "Trop de tentatives. Patientez quelques minutes." };
    return { ok: false, error: error.message };
  }
  // Si la confirmation d'e-mail est désactivée, Supabase ouvre directement la session.
  if (data.session) redirect(role === "mentor" ? "/mentor/profil?bienvenue=1" : "/mentore/profil?bienvenue=1");
  return { ok: true, data: { needsConfirmation: true }, message: "Vérifiez votre boîte mail pour activer votre compte." };
}

export async function signInAction(input: unknown): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const supabase = await getServerSupabase();
  if (!supabase) return notConfigured;

  const { data, error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) {
    if (error.code === "email_not_confirmed") return { ok: false, error: "Adresse e-mail non confirmée. Consultez votre boîte mail." };
    if (error.status === 429) return { ok: false, error: "Trop de tentatives. Patientez quelques minutes." };
    return { ok: false, error: "E-mail ou mot de passe incorrect." };
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle<{ role: UserRole }>();
  const fallback = profile ? homeForRole(profile.role) : "/espace";
  redirect(parsed.data.next ? safeInternalPath(parsed.data.next, fallback) : fallback);
}

export async function signOutAction(): Promise<void> {
  const supabase = await getServerSupabase();
  await supabase?.auth.signOut();
  redirect("/");
}

export async function requestPasswordResetAction(input: unknown): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const supabase = await getServerSupabase();
  if (!supabase) return notConfigured;
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl()}/auth/confirm?next=/reinitialiser-mot-de-passe`,
  });
  // Même réponse que l'adresse existe ou non (ne révèle pas les comptes existants).
  return { ok: true, message: "Si un compte existe pour cette adresse, un lien de réinitialisation vient d'être envoyé." };
}

export async function resendConfirmationAction(input: unknown): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const supabase = await getServerSupabase();
  if (!supabase) return notConfigured;
  await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: `${siteUrl()}/auth/confirm?next=/espace` },
  });
  return { ok: true, message: "Si l'adresse attend une confirmation, un nouvel e-mail a été envoyé." };
}

export async function updatePasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const supabase = await getServerSupabase();
  if (!supabase) return notConfigured;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Lien expiré. Demandez un nouveau lien de réinitialisation." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: error.code === "same_password" ? "Choisissez un mot de passe différent de l'ancien." : error.message };
  return { ok: true, message: "Mot de passe mis à jour." };
}
