import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Espaces réservés aux utilisateurs connectés. Le rôle exact est vérifié
// ensuite côté serveur dans chaque layout (lecture de profiles.role en base).
const PROTECTED = [/^\/espace(\/|$)/, /^\/mentore(\/|$)/, /^\/mentor(\/|$)/, /^\/admin(\/|$)/];

/**
 * Proxy (ex-middleware) Next.js : rafraîchit la session Supabase à chaque
 * requête et redirige vers /connexion si une page protégée est demandée sans
 * session.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isProtected = PROTECTED.some((re) => re.test(request.nextUrl.pathname));

  if (!url || !key) {
    if (!isProtected) return NextResponse.next();
    const target = request.nextUrl.clone();
    target.pathname = "/connexion";
    target.search = "";
    return NextResponse.redirect(target);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // getUser() valide le jeton auprès de Supabase (contrairement à getSession()).
  const { data: { user } } = await supabase.auth.getUser();

  if (isProtected && !user) {
    const target = request.nextUrl.clone();
    target.pathname = "/connexion";
    target.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(target);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
