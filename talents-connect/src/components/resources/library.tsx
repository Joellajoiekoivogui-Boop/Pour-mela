import { Download, ExternalLink, FileText, Image as ImageIcon, Library, Link2, PlayCircle, Search } from "lucide-react";
import { ActionButton } from "@/components/shared/action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/misc";
import { deleteResourceAction, setResourcePublishedAction } from "@/lib/actions/content";
import { formatDate } from "@/lib/dates";
import { videoEmbedUrl } from "@/lib/embeds";
import { RESOURCE_TYPE_LABELS } from "@/lib/labels";
import { getCatalog, getPeople } from "@/lib/queries";
import type { Session } from "@/lib/auth";
import { fullName } from "@/lib/utils";
import type { Resource, ResourceType } from "@/types/db";

const TYPE_ICONS: Record<ResourceType, React.ComponentType<{ className?: string }>> = { pdf: FileText, image: ImageIcon, link: Link2, video: PlayCircle };

/**
 * Liste de ressources avec recherche et filtres (paramètres d'URL).
 * `mode` : « browse » (bibliothèque publiée), « mine » (ressources de l'auteur), « admin » (toutes).
 */
export async function ResourceLibrary({ session, mode, filters }: {
  session: Session; mode: "browse" | "mine" | "admin"; filters: { q?: string; domaine?: string; type?: string };
}) {
  const { supabase, user, profile } = session;
  const { domains } = await getCatalog();
  const domain = domains.find((d) => d.slug === filters.domaine);
  let query = supabase.from("resources").select("*").order("created_at", { ascending: false }).limit(100);
  if (mode === "browse") query = query.eq("is_published", true);
  if (mode === "mine") query = query.eq("author_id", user.id);
  if (domain) query = query.eq("domain_id", domain.id);
  if (filters.type && filters.type in RESOURCE_TYPE_LABELS) query = query.eq("type", filters.type);
  if (filters.q) {
    const q = filters.q.replace(/[%,()]/g, " ").slice(0, 80);
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }
  const { data } = await query;
  const list = (data ?? []) as Resource[];
  const authors = await getPeople(supabase, list.map((r) => r.author_id));
  const domainName = new Map(domains.map((d) => [d.id, d.name]));
  const canManage = (r: Resource) => r.author_id === user.id || profile.role === "admin" || profile.role === "super_admin";

  return (
    <div className="space-y-5">
      <form className="grid gap-3 sm:grid-cols-[1fr_220px_180px_auto]" role="search">
        <Input name="q" defaultValue={filters.q} placeholder="Rechercher une ressource…" aria-label="Rechercher" />
        <Select name="domaine" defaultValue={filters.domaine ?? ""} aria-label="Catégorie">
          <option value="">Toutes les catégories</option>
          {domains.map((d) => <option key={d.id} value={d.slug}>{d.name}</option>)}
        </Select>
        <Select name="type" defaultValue={filters.type ?? ""} aria-label="Format">
          <option value="">Tous les formats</option>
          {Object.entries(RESOURCE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Button type="submit" variant="navy"><Search /> Filtrer</Button>
      </form>

      {list.length === 0 ? <EmptyState icon={Library} title="Aucune ressource" description={mode === "mine" ? "Partagez un guide, une vidéo ou un document utile à vos mentorés." : "Aucune ressource ne correspond à ces critères."} /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((r) => {
            const Icon = TYPE_ICONS[r.type];
            const fileUrl = r.file_path ? supabase.storage.from("resources").getPublicUrl(r.file_path).data.publicUrl : null;
            const href = fileUrl ?? r.url;
            const embed = r.type === "video" && r.url ? videoEmbedUrl(r.url) : null;
            return (
              <Card key={r.id} className="flex flex-col p-5">
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary"><Icon className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-navy">{r.title}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {r.domain_id && <Badge tone="primary">{domainName.get(r.domain_id)}</Badge>}
                      <Badge>{RESOURCE_TYPE_LABELS[r.type]}</Badge>
                      {!r.is_published && <Badge tone="warning">Masquée</Badge>}
                    </div>
                  </div>
                </div>
                {r.description && <p className="mt-3 line-clamp-3 text-sm text-slate-600">{r.description}</p>}
                {embed && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-primary">Regarder la vidéo</summary>
                    <div className="mt-2 aspect-video overflow-hidden rounded-lg bg-black">
                      <iframe src={embed} title={r.title} className="size-full" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
                    </div>
                  </details>
                )}
                <p className="mt-3 text-xs text-muted">Par {fullName(authors.get(r.author_id ?? ""))} · {formatDate(r.created_at)}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  {href && (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-[13px] font-medium hover:bg-subtle">
                      {fileUrl ? <><Download className="size-4" /> Télécharger</> : <><ExternalLink className="size-4" /> Ouvrir</>}
                    </a>
                  )}
                  {mode !== "browse" && canManage(r) && (
                    <>
                      <ActionButton size="sm" variant="ghost" action={() => setResourcePublishedAction(r.id, !r.is_published)}>{r.is_published ? "Masquer" : "Publier"}</ActionButton>
                      <ActionButton size="sm" variant="danger-ghost" confirm="Supprimer cette ressource ?" action={() => deleteResourceAction(r.id)}>Supprimer</ActionButton>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
