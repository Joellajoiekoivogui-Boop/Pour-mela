export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Vrai lorsque Supabase est configuré ; sinon l'application tourne en mode démonstration. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
