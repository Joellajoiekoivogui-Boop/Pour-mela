import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { VerifyActions } from "@/components/admin/verify-actions";
import { VerificationBadge } from "@/components/shared/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { getCatalog } from "@/lib/queries";
import { cn, fullName } from "@/lib/utils";
import type { MentorProfile, Profile, VerificationStatus } from "@/types/db";

export const metadata: Metadata = { title: "Vérification des mentors" };

type Row = MentorProfile & { profile: Pick<Profile, "id" | "first_name" | "last_name" | "avatar_url" | "bio" | "location" | "is_demo" | "role" | "created_at"> };
const TABS: [VerificationStatus, string][] = [["pending", "En attente"], ["verified", "Vérifiés"], ["rejected", "Refusés"]];

export default async function AdminMentorsPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const status: VerificationStatus = statut === "verified" || statut === "rejected" ? statut : "pending";
  const { supabase } = await requireRole(["admin", "super_admin"]);
  const [{ data }, { domains, skills }] = await Promise.all([
    supabase.from("mentor_profiles").select("*, profile:profiles!mentor_profiles_user_id_fkey!inner(id, first_name, last_name, avatar_url, bio, location, is_demo, role, created_at)").eq("verification_status", status).eq("profile.role", "mentor").order("created_at", { ascending: true }).limit(100),
    getCatalog(),
  ]);
  const rows = (data ?? []) as unknown as Row[];
  const ids = rows.map((r) => r.user_id);
  const [ud, us] = ids.length ? await Promise.all([
    supabase.from("user_domains").select("user_id, domain_id").in("user_id", ids),
    supabase.from("user_skills").select("user_id, skill_id").eq("relation", "teaches").in("user_id", ids),
  ]) : [{ data: [] }, { data: [] }];
  const dn = new Map(domains.map((d) => [d.id, d.name]));
  const sn = new Map(skills.map((s) => [s.id, s.name]));
  const tags = (list: { user_id: string }[] | null, id: string, key: "domain_id" | "skill_id", names: Map<number, string>) =>
    ((list ?? []) as ({ user_id: string } & Record<string, number>)[]).filter((x) => x.user_id === id).map((x) => names.get(x[key]!)).filter(Boolean) as string[];

  return (
    <>
      <PageHeader title="Vérification des mentors" description="Seuls les mentors vérifiés apparaissent dans l'annuaire et les recommandations." />
      <div className="mb-5 flex gap-2">
        {TABS.map(([v, l]) => <Link key={v} href={`/admin/mentors?statut=${v}`} className={cn("rounded-full px-3 py-1.5 text-sm", status === v ? "bg-navy text-white" : "bg-subtle text-slate-700")}>{l}</Link>)}
      </div>
      {rows.length === 0 ? <EmptyState icon={ShieldCheck} title="Aucun profil dans cette catégorie" /> : (
        <div className="space-y-4">
          {rows.map((r) => (
            <Card key={r.user_id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row">
                <div className="flex min-w-0 flex-1 gap-4">
                  <Avatar person={r.profile} size="lg" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-navy">{fullName(r.profile)}</p>
                      <VerificationBadge status={r.verification_status} />
                      {r.profile.is_demo && <Badge tone="warning">Démo</Badge>}
                    </div>
                    <p className="text-sm text-slate-700">{[r.job_title, r.organization].filter(Boolean).join(" · ") || <span className="text-danger">Poste non renseigné</span>} · {r.years_experience} ans d&apos;expérience · inscrit le {formatDate(r.profile.created_at)}</p>
                    {r.profile.bio ? <p className="line-clamp-3 text-sm text-muted">{r.profile.bio}</p> : <p className="text-sm text-danger">Présentation non renseignée</p>}
                    {r.experiences && <details className="text-sm"><summary className="cursor-pointer font-medium text-primary">Expériences et formation</summary><p className="mt-1 whitespace-pre-line text-slate-700">{r.experiences}</p>{r.education && <p className="mt-2 whitespace-pre-line text-slate-700">{r.education}</p>}</details>}
                    <div className="flex flex-wrap gap-1">
                      {tags(ud.data, r.user_id, "domain_id", dn).map((t) => <Badge key={t} tone="primary">{t}</Badge>)}
                      {tags(us.data, r.user_id, "skill_id", sn).map((t) => <Badge key={t}>{t}</Badge>)}
                    </div>
                    {r.rejection_reason && <p className="text-xs text-danger">Motif du refus : {r.rejection_reason}</p>}
                  </div>
                </div>
                <div className="lg:w-64"><VerifyActions userId={r.user_id} status={r.verification_status} /></div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
