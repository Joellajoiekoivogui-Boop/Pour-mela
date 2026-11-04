import type { Metadata } from "next";
/* eslint-disable @next/next/no-img-element -- images externes fournies par l'administration */
import Link from "next/link";
import { Briefcase, CalendarClock, ExternalLink, MapPin, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { BookmarkButton } from "@/components/opportunities/bookmark-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/misc";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { OPPORTUNITY_CATEGORY_LABELS } from "@/lib/labels";
import { getCatalog } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { Opportunity } from "@/types/db";

export const metadata: Metadata = { title: "Opportunités" };

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<{ q?: string; categorie?: string; domaine?: string; favoris?: string }> }) {
  const f = await searchParams;
  const { supabase, profile } = await requireRole(["mentee"]);
  const { domains } = await getCatalog();
  const today = new Date().toISOString().slice(0, 10);
  const { data: marks } = await supabase.from("opportunity_bookmarks").select("opportunity_id").eq("user_id", profile.id);
  const saved = new Set(((marks ?? []) as { opportunity_id: string }[]).map((m) => m.opportunity_id));

  let query = supabase.from("opportunities").select("*").eq("is_published", true).or(`deadline.is.null,deadline.gte.${today}`).order("deadline", { ascending: true, nullsFirst: false }).limit(100);
  if (f.categorie && f.categorie in OPPORTUNITY_CATEGORY_LABELS) query = query.eq("category", f.categorie);
  const domain = domains.find((d) => d.slug === f.domaine);
  if (domain) query = query.eq("domain_id", domain.id);
  if (f.q) { const q = f.q.replace(/[%,()]/g, " ").slice(0, 80); query = query.or(`title.ilike.%${q}%,organization.ilike.%${q}%,description.ilike.%${q}%`); }
  if (f.favoris) query = query.in("id", saved.size ? [...saved] : ["00000000-0000-0000-0000-000000000000"]);
  const { data } = await query;
  const list = (data ?? []) as Opportunity[];
  const dn = new Map(domains.map((d) => [d.id, d.name]));

  return (
    <>
      <PageHeader title="Opportunités" description="Stages, emplois, bourses, formations, concours… publiés et vérifiés par l'équipe TALENTS CONNECT." />
      <div className="mb-4 flex gap-2">
        <Link href="/mentore/opportunites" className={cn("rounded-full px-3 py-1.5 text-sm", !f.favoris ? "bg-navy text-white" : "bg-subtle text-slate-700")}>Toutes</Link>
        <Link href="/mentore/opportunites?favoris=1" className={cn("rounded-full px-3 py-1.5 text-sm", f.favoris ? "bg-navy text-white" : "bg-subtle text-slate-700")}>Mes favoris ({saved.size})</Link>
      </div>
      <form className="mb-6 grid gap-3 sm:grid-cols-[1fr_200px_220px_auto]" role="search">
        {f.favoris && <input type="hidden" name="favoris" value="1" />}
        <Input name="q" defaultValue={f.q} placeholder="Rechercher…" aria-label="Rechercher" />
        <Select name="categorie" defaultValue={f.categorie ?? ""} aria-label="Catégorie">
          <option value="">Toutes catégories</option>
          {Object.entries(OPPORTUNITY_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select name="domaine" defaultValue={f.domaine ?? ""} aria-label="Domaine">
          <option value="">Tous les domaines</option>
          {domains.map((d) => <option key={d.id} value={d.slug}>{d.name}</option>)}
        </Select>
        <Button type="submit" variant="navy"><Search /> Filtrer</Button>
      </form>
      {list.length === 0 ? <EmptyState icon={Briefcase} title="Aucune opportunité" description="Aucune opportunité ouverte ne correspond. Vous serez notifié(e) des nouvelles publications dans vos domaines." /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((o) => (
            <Card key={o.id} className="flex flex-col overflow-hidden">
              {o.image_url && <img src={o.image_url} alt="" className="h-36 w-full object-cover" loading="lazy" />}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap gap-1.5"><Badge tone="violet">{OPPORTUNITY_CATEGORY_LABELS[o.category]}</Badge>{o.domain_id && <Badge tone="primary">{dn.get(o.domain_id)}</Badge>}</div>
                    <p className="font-semibold text-navy">{o.title}</p>
                    <p className="text-sm text-slate-600">{o.organization}</p>
                  </div>
                  <BookmarkButton opportunityId={o.id} saved={saved.has(o.id)} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  {o.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3" aria-hidden />{o.location}</span>}
                  {o.deadline && <span className="inline-flex items-center gap-1"><CalendarClock className="size-3" aria-hidden />Date limite : {formatDate(o.deadline)}</span>}
                </div>
                <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm text-slate-700">{o.description}</p>
                {o.requirements && <details className="mt-2 text-sm"><summary className="cursor-pointer font-medium text-primary">Conditions</summary><p className="mt-1 whitespace-pre-line text-slate-700">{o.requirements}</p></details>}
                {o.apply_url && (
                  <a href={o.apply_url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex h-9 w-fit items-center gap-1.5 self-start rounded-lg bg-primary px-4 pt-0 text-sm font-medium text-white hover:bg-primary-hover [margin-top:1rem]">
                    Candidater <ExternalLink className="size-4" />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
