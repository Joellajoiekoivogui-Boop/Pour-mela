import Link from "next/link";
import { BookOpen, Briefcase, CalendarCheck, ClipboardList, Flag, GraduationCap, Handshake, ShieldCheck, UserCheck, Users } from "lucide-react";
import { PageHeader, StatCard } from "@/components/layout/page-header";
import { GoalsBarChart } from "@/components/charts/progress-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/misc";
import { requireRole } from "@/lib/auth";
import { timeAgo } from "@/lib/dates";
import { getPeople } from "@/lib/queries";
import { fullName } from "@/lib/utils";

type Overview = Record<"users" | "mentors" | "mentees" | "mentors_pending" | "mentorships_active" | "sessions_completed" | "requests_pending" | "resources" | "opportunities" | "reports_open", number>;
type Log = { id: number; admin_id: string | null; action: string; target_type: string | null; created_at: string };

const ACTION_LABELS: Record<string, string> = {
  "mentor.verify": "a vérifié un mentor", "mentor.reject": "a refusé un profil mentor", "user.set_role": "a modifié un rôle",
  "user.suspend": "a suspendu un compte", "user.unsuspend": "a réactivé un compte",
};

export default async function AdminOverview() {
  const { supabase } = await requireRole(["admin", "super_admin"]);
  const [{ data, error }, logs, domains, userDomains] = await Promise.all([
    supabase.rpc("admin_overview"),
    supabase.from("admin_activity_logs").select("*").order("created_at", { ascending: false }).limit(8),
    supabase.from("expertise_domains").select("id, name").order("sort_order"),
    supabase.from("user_domains").select("domain_id"),
  ]);
  const o = (data ?? {}) as Overview;
  const logList = (logs.data ?? []) as Log[];
  const people = await getPeople(supabase, logList.map((l) => l.admin_id));
  const counts = new Map<number, number>();
  for (const d of (userDomains.data ?? []) as { domain_id: number }[]) counts.set(d.domain_id, (counts.get(d.domain_id) ?? 0) + 1);
  const domainChart = ((domains.data ?? []) as { id: number; name: string }[]).map((d) => ({ name: d.name.length > 22 ? `${d.name.slice(0, 21)}…` : d.name, progress: counts.get(d.id) ?? 0 }));

  return (
    <>
      <PageHeader title="Vue générale" description="Indicateurs en temps réel de la plateforme." />
      {error && <Alert tone="danger" className="mb-6">Impossible de charger les indicateurs.</Alert>}
      {o.mentors_pending > 0 && <Alert tone="warning" className="mb-6" title={`${o.mentors_pending} mentor(s) en attente de vérification`}><Link href="/admin/mentors" className="font-medium underline">Traiter les vérifications</Link></Alert>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Utilisateurs" value={o.users ?? 0} icon={Users} />
        <StatCard label="Mentors" value={o.mentors ?? 0} icon={UserCheck} tone="violet" />
        <StatCard label="Mentorés" value={o.mentees ?? 0} icon={GraduationCap} tone="success" />
        <StatCard label="Mentors à vérifier" value={o.mentors_pending ?? 0} icon={ShieldCheck} tone="warning" />
        <StatCard label="Mentorats actifs" value={o.mentorships_active ?? 0} icon={Handshake} />
        <StatCard label="Séances réalisées" value={o.sessions_completed ?? 0} icon={CalendarCheck} tone="success" />
        <StatCard label="Demandes en attente" value={o.requests_pending ?? 0} icon={ClipboardList} tone="warning" />
        <StatCard label="Ressources" value={o.resources ?? 0} icon={BookOpen} tone="violet" />
        <StatCard label="Opportunités" value={o.opportunities ?? 0} icon={Briefcase} />
        <StatCard label="Signalements ouverts" value={o.reports_open ?? 0} icon={Flag} tone="warning" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Intérêt par domaine</CardTitle><p className="text-sm text-muted">Nombre de membres (mentors et mentorés) ayant choisi chaque domaine</p></CardHeader>
          <CardContent><GoalsBarChart data={domainChart} unit="" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between"><CardTitle>Dernières actions d&apos;administration</CardTitle><Link href="/admin/journal" className="text-sm text-primary hover:underline">Journal</Link></CardHeader>
          <CardContent>
            {logList.length === 0 ? <p className="text-sm text-muted">Aucune action enregistrée.</p> : (
              <ul className="space-y-3 text-sm">
                {logList.map((l) => <li key={l.id}><span className="font-medium">{fullName(people.get(l.admin_id ?? ""))}</span> {ACTION_LABELS[l.action] ?? l.action} <span className="text-xs text-muted">· {timeAgo(l.created_at)}</span></li>)}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
