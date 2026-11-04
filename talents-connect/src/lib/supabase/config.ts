export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Vrai lorsque les variables Supabase sont définies (voir .env.example). */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Adresse publique du site, utilisée dans les liens envoyés par e-mail. */
export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return (fromEnv || "http://localhost:3000").replace(/\/$/, "");
}
