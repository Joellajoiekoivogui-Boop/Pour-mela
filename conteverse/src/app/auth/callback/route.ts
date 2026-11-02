import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

/** Échange le code de confirmation e-mail contre une session. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const supabase = await getServerSupabase();
  if (code && supabase) await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL("/dashboard", url.origin));
}
