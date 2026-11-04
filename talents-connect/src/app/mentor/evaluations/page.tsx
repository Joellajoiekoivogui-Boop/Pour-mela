import type { Metadata } from "next";
import { Star } from "lucide-react";
import { PageHeader, StatCard } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import type { Review } from "@/types/db";

export const metadata: Metadata = { title: "Évaluations" };

export default async function MentorReviewsPage() {
  const { supabase, profile } = await requireRole(["mentor"]);
  const { data } = await supabase.from("reviews").select("*").eq("mentor_id", profile.id).eq("is_hidden", false).order("created_at", { ascending: false });
  const list = (data ?? []) as Review[];
  const avg = list.length ? Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10 : null;
  return (
    <>
      <PageHeader title="Évaluations" description="Les avis laissés par vos mentorés. Ils sont visibles sur votre profil public." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:max-w-xl">
        <StatCard label="Note moyenne" value={avg != null ? `${avg}/5` : "—"} icon={Star} tone="warning" />
        <StatCard label="Nombre d'avis" value={list.length} icon={Star} />
      </div>
      {list.length === 0 ? <EmptyState icon={Star} title="Pas encore d'évaluation" description="Vos mentorés peuvent évaluer le mentorat depuis leur espace de suivi." /> : (
        <Card className="divide-y divide-border">
          {list.map((r) => (
            <div key={r.id} className="p-4">
              <p className="text-amber-500" aria-label={`${r.rating} sur 5`}>{"★".repeat(r.rating)}<span className="text-slate-300">{"★".repeat(5 - r.rating)}</span></p>
              {r.comment && <p className="mt-1 text-sm text-slate-700">{r.comment}</p>}
              <p className="mt-1 text-xs text-muted">{formatDate(r.created_at)}</p>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
