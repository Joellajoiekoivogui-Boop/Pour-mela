import type { Metadata } from "next";
import Link from "next/link";
import { Ban, Database, Lock, ShieldCheck } from "lucide-react";
import { getCurrentUserWithRole } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PageHeader } from "@/components/ui/SectionTitle";
import { articles } from "@/data/articles";
import { countries } from "@/data/countries";
import { categories } from "@/data/categories";
import { stories } from "@/data/stories";
import { allQuizzes } from "@/data/quizzes";
import { resolveReview, setArticleStatus, setUserRole } from "./actions";

export const metadata: Metadata = { title: "Administration", robots: { index: false } };
export const dynamic = "force-dynamic";

function LockedView({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <Lock className="mx-auto size-14 text-encre/30" aria-hidden />
      <h1 className="mt-4 text-3xl font-black">{title}</h1>
      <div className="mt-3 text-lg text-encre-doux">{children}</div>
    </div>
  );
}

function CatalogOverview() {
  const toValidate = [
    ...articles.filter((a) => a.status === "a-valider").map((a) => ({ type: "Article", title: a.title, note: a.validationNote })),
    ...countries.filter((c) => c.status === "a-valider").map((c) => ({ type: "Pays", title: c.name, note: c.validationNote })),
  ];
  return (
    <section className="mx-auto max-w-5xl px-4 pb-16">
      <h2 className="text-2xl font-black">Aperçu du catalogue local (lecture seule)</h2>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          ["Pays", countries.length],
          ["Catégories", categories.length],
          ["Articles", articles.length],
          ["Histoires", stories.length],
          ["Quiz", allQuizzes.length],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-white p-4 shadow-carte">
            <dt className="text-sm font-bold text-encre-doux">{k}</dt>
            <dd className="text-2xl font-black">{v}</dd>
          </div>
        ))}
      </dl>
      <h3 className="mt-8 text-xl font-black">Contenus à faire valider ({toValidate.length})</h3>
      <ul className="mt-3 grid gap-2">
        {toValidate.map((t) => (
          <li key={t.title} className="rounded-2xl bg-jaune-50 p-4 text-sm">
            <span className="font-extrabold">{t.type} — {t.title}</span>
            {t.note && <span className="block text-encre-doux">{t.note}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function AdminPage() {
  if (!isSupabaseConfigured) {
    return (
      <>
        <LockedView title="Administration protégée">
          <p>L&apos;administration nécessite un compte avec le rôle <strong>administrateur</strong> ou <strong>éditeur</strong>, géré par Supabase.</p>
          <p className="mt-2 text-base">Supabase n&apos;est pas configuré sur cette installation (mode démonstration) : aucune modification n&apos;est possible.</p>
        </LockedView>
        <CatalogOverview />
      </>
    );
  }

  const { supabase, user, role } = await getCurrentUserWithRole();
  if (!supabase || !user)
    return (
      <LockedView title="Connexion requise">
        <Link href="/connexion" className="font-extrabold text-orange-700 underline">
          Se connecter
        </Link>{" "}
        avec un compte administrateur ou éditeur.
      </LockedView>
    );
  if (role !== "admin" && role !== "editeur")
    return (
      <LockedView title="Accès refusé">
        <Ban className="mx-auto mb-2 size-6 text-orange-600" aria-hidden />
        Ce compte n&apos;a pas les droits d&apos;administration.
      </LockedView>
    );

  const [arts, cnt, cats, sts, qz, med, src, reviews, logs, users] = await Promise.all([
    supabase.from("articles").select("id, slug, title, status, editorial_status, updated_at").order("updated_at", { ascending: false }).limit(100),
    supabase.from("countries").select("id", { count: "exact", head: true }),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("stories").select("id", { count: "exact", head: true }),
    supabase.from("quizzes").select("id", { count: "exact", head: true }),
    supabase.from("media_assets").select("id", { count: "exact", head: true }),
    supabase.from("sources").select("id", { count: "exact", head: true }),
    supabase.from("content_reviews").select("id, content_type, content_slug, comment, status, created_at").eq("status", "en_attente").limit(50),
    supabase.from("moderation_logs").select("id, action, target_table, created_at").order("created_at", { ascending: false }).limit(20),
    role === "admin" ? supabase.from("profiles").select("id, pseudo, created_at, user_roles(role)").limit(100) : Promise.resolve({ data: null }),
  ]);

  return (
    <>
      <PageHeader eyebrow={role === "admin" ? "Administrateur" : "Éditeur"} title="Administration">
        Gestion des contenus, des relectures et {role === "admin" ? "des utilisateurs" : "des statuts éditoriaux"}.
      </PageHeader>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {[
            ["Articles", arts.data?.length ?? 0],
            ["Pays", cnt.count ?? 0],
            ["Catégories", cats.count ?? 0],
            ["Histoires", sts.count ?? 0],
            ["Quiz", qz.count ?? 0],
            ["Médias", med.count ?? 0],
            ["Sources", src.count ?? 0],
          ].map(([k, v]) => (
            <div key={k as string} className="rounded-2xl bg-white p-4 shadow-carte">
              <dt className="text-sm font-bold text-encre-doux">{k}</dt>
              <dd className="text-2xl font-black">{v}</dd>
            </div>
          ))}
        </dl>
        {!arts.data?.length && (
          <p className="flex items-center gap-2 rounded-2xl bg-bleu-50 p-4 text-sm font-bold text-bleu-700">
            <Database className="size-4" aria-hidden /> La base est vide : exécutez <code>npm run seed</code> puis importez <code>supabase/seed.sql</code> (voir README).
          </p>
        )}

        <section className="overflow-x-auto rounded-3xl bg-white p-6 shadow-carte">
          <h2 className="text-xl font-black">Articles</h2>
          <table className="mt-4 w-full min-w-[640px] text-left text-sm">
            <thead className="text-encre-doux">
              <tr>
                <th className="pb-2">Titre</th>
                <th className="pb-2">Fiabilité</th>
                <th className="pb-2">Publication</th>
              </tr>
            </thead>
            <tbody>
              {(arts.data ?? []).map((a) => (
                <tr key={a.id} className="border-t border-encre/5">
                  <td className="py-2 font-bold">{a.title}</td>
                  <td className="py-2">{a.editorial_status === "verifie" ? "Sourcé" : "À valider"}</td>
                  <td className="py-2">
                    <form action={setArticleStatus} className="flex gap-2">
                      <input type="hidden" name="id" value={a.id} />
                      <select name="status" defaultValue={a.status} className="rounded-lg bg-creme px-2 py-1 ring-1 ring-encre/10">
                        <option value="brouillon">Brouillon</option>
                        <option value="relecture">En relecture</option>
                        <option value="publie">Publié</option>
                        <option value="archive">Archivé</option>
                      </select>
                      <button className="rounded-lg bg-encre px-3 py-1 font-bold text-white">OK</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-carte">
          <h2 className="text-xl font-black">Relectures en attente</h2>
          {reviews.data?.length ? (
            <ul className="mt-4 grid gap-3">
              {reviews.data.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-jaune-50 p-4 text-sm">
                  <span>
                    <strong>{r.content_type}</strong> · {r.content_slug} — {r.comment}
                  </span>
                  <form action={resolveReview} className="flex gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <button name="decision" value="approuve" className="rounded-lg bg-vert-500 px-3 py-1 font-bold text-white">Approuver</button>
                    <button name="decision" value="rejete" className="rounded-lg bg-orange-500 px-3 py-1 font-bold text-white">Rejeter</button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-encre-doux">Aucune relecture en attente.</p>
          )}
        </section>

        {role === "admin" && (
          <section className="overflow-x-auto rounded-3xl bg-white p-6 shadow-carte">
            <h2 className="flex items-center gap-2 text-xl font-black">
              <ShieldCheck className="size-5" aria-hidden /> Utilisateurs et rôles
            </h2>
            <table className="mt-4 w-full min-w-[540px] text-left text-sm">
              <thead className="text-encre-doux">
                <tr>
                  <th className="pb-2">Pseudonyme</th>
                  <th className="pb-2">Rôle</th>
                </tr>
              </thead>
              <tbody>
                {((users.data ?? []) as { id: string; pseudo: string | null; user_roles: { role: string }[] }[]).map((u) => (
                  <tr key={u.id} className="border-t border-encre/5">
                    <td className="py-2 font-bold">{u.pseudo ?? "—"}</td>
                    <td className="py-2">
                      {u.id === user.id ? (
                        <span className="font-bold">admin (vous)</span>
                      ) : (
                        <form action={setUserRole} className="flex gap-2">
                          <input type="hidden" name="user_id" value={u.id} />
                          <select name="role" defaultValue={u.user_roles?.[0]?.role ?? "utilisateur"} className="rounded-lg bg-creme px-2 py-1 ring-1 ring-encre/10">
                            <option value="utilisateur">Utilisateur</option>
                            <option value="editeur">Éditeur</option>
                            <option value="admin">Administrateur</option>
                          </select>
                          <button className="rounded-lg bg-encre px-3 py-1 font-bold text-white">OK</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <section className="rounded-3xl bg-white p-6 shadow-carte">
          <h2 className="text-xl font-black">Journal de modération</h2>
          <ul className="mt-3 grid gap-1 text-sm text-encre-doux">
            {(logs.data ?? []).map((l) => (
              <li key={l.id}>
                {new Date(l.created_at).toLocaleString("fr-FR")} — {l.action} ({l.target_table})
              </li>
            ))}
            {!logs.data?.length && <li>Aucune action enregistrée.</li>}
          </ul>
        </section>
      </div>
    </>
  );
}
