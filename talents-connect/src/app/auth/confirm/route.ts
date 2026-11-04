import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/utils";

/**
 * Point d'arrivée des liens envoyés par e-mail (confirmation d'inscription,
 * réinitialisation du mot de passe). Gère les deux formats de Supabase :
 * ?code=… (PKCE) et ?token_hash=…&type=… (modèles d'e-mail personnalisés).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeInternalPath(searchParams.get("next"), "/espace");
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.redirect(`${origin}/connexion`);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  let ok = false;
  if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && type) ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;

  if (!ok) return NextResponse.redirect(`${origin}/connexion?erreur=lien`);
  return NextResponse.redirect(`${origin}${next}`);
}
