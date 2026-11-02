"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function AuthForm() {
  const sb = getBrowserSupabase();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    sb?.auth.getUser().then(({ data }) => setCurrent(data.user?.email ?? null));
  }, [sb]);

  if (!isSupabaseConfigured || !sb) {
    return (
      <div className="rounded-3xl bg-jaune-50 p-6">
        <h2 className="text-xl font-black">Mode démonstration</h2>
        <p className="mt-2 text-encre-doux">
          Les comptes ne sont pas encore activés sur cette installation : Supabase n&apos;est pas configuré. La progression est enregistrée sur cet appareil, et toutes les fonctionnalités restent utilisables.
        </p>
        <p className="mt-2 text-sm text-encre-doux">Pour activer les comptes, renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY (voir le README).</p>
        <Link href="/dashboard" className="mt-4 inline-block rounded-2xl bg-orange-500 px-5 py-3 font-extrabold text-white">
          Continuer sans compte
        </Link>
      </div>
    );
  }

  if (current) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-carte">
        <p className="font-bold">Connecté en tant que {current}.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/dashboard" className="rounded-2xl bg-orange-500 px-5 py-3 font-extrabold text-white">
            Mon espace
          </Link>
          <button
            onClick={async () => {
              await sb.auth.signOut();
              setCurrent(null);
            }}
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-extrabold ring-2 ring-encre/10"
          >
            <LogOut className="size-4" aria-hidden /> Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signin") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      } else {
        if (!adult) throw new Error("Le compte doit être créé par un adulte responsable.");
        const { error } = await sb.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: { account_type: "responsable" } },
        });
        if (error) throw error;
        setMessage({ kind: "ok", text: "Compte créé ! Vérifiez votre boîte e-mail pour confirmer l'adresse, puis connectez-vous." });
      }
    } catch (err) {
      setMessage({ kind: "err", text: err instanceof Error ? err.message : "Une erreur est survenue." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-carte ring-1 ring-encre/5 sm:p-8">
      <div className="mb-6 flex rounded-2xl bg-encre/5 p-1" role="tablist">
        {(["signin", "signup"] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`flex-1 rounded-xl py-2 font-extrabold ${mode === m ? "bg-white shadow" : "text-encre-doux"}`}>
            {m === "signin" ? "Se connecter" : "Créer un compte"}
          </button>
        ))}
      </div>
      <label className="block">
        <span className="font-extrabold">E-mail de l&apos;adulte responsable</span>
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 min-h-12 w-full rounded-2xl bg-creme px-4 ring-1 ring-encre/10" />
      </label>
      <label className="mt-4 block">
        <span className="font-extrabold">Mot de passe</span>
        <input type="password" required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 min-h-12 w-full rounded-2xl bg-creme px-4 ring-1 ring-encre/10" />
      </label>
      {mode === "signup" && (
        <label className="mt-4 flex items-start gap-3 text-sm">
          <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-1 size-5" />
          <span>Je suis un parent ou un enseignant, et je crée ce compte pour un enfant. L&apos;enfant n&apos;utilisera qu&apos;un pseudonyme.</span>
        </label>
      )}
      {message && (
        <p className={`mt-4 rounded-2xl p-3 text-sm font-bold ${message.kind === "ok" ? "bg-vert-50 text-vert-700" : "bg-orange-50 text-orange-700"}`} role="status">
          {message.text}
        </p>
      )}
      <button type="submit" disabled={busy} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 font-extrabold text-white hover:bg-orange-600 disabled:opacity-50">
        {mode === "signin" ? <LogIn className="size-5" aria-hidden /> : <UserPlus className="size-5" aria-hidden />}
        {busy ? "Patientez…" : mode === "signin" ? "Se connecter" : "Créer le compte"}
      </button>
    </form>
  );
}
