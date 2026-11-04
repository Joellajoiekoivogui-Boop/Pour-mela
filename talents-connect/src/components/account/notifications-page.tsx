import Link from "next/link";
import { Bell } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { deleteReadNotificationsAction, markAllNotificationsReadAction, markNotificationReadAction } from "@/lib/actions/notifications";
import { timeAgo } from "@/lib/dates";
import type { Session } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/db";

export async function NotificationsPage({ session }: { session: Session }) {
  const { data } = await session.supabase.from("notifications").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(100);
  const list = (data ?? []) as AppNotification[];
  const unread = list.filter((n) => !n.read_at).length;
  return (
    <>
      <PageHeader
        title="Notifications"
        description={unread > 0 ? `${unread} notification${unread > 1 ? "s" : ""} non lue${unread > 1 ? "s" : ""}` : "Vous êtes à jour."}
        actions={<>
          {unread > 0 && <ActionButton variant="secondary" size="sm" action={() => markAllNotificationsReadAction()}>Tout marquer comme lu</ActionButton>}
          {list.some((n) => n.read_at) && <ActionButton variant="ghost" size="sm" confirm="Supprimer les notifications déjà lues ?" action={() => deleteReadNotificationsAction()}>Supprimer les lues</ActionButton>}
        </>}
      />
      {list.length === 0 ? <EmptyState icon={Bell} title="Aucune notification" description="Demandes, messages, séances et objectifs : tout s'affichera ici." /> : (
        <Card className="divide-y divide-border">
          {list.map((n) => (
            <div key={n.id} className={cn("flex items-start gap-3 p-4", !n.read_at && "bg-primary-soft/40")}>
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-primary")} aria-hidden />
              <div className="min-w-0 flex-1">
                {n.link ? <Link href={n.link} className="text-sm font-medium text-navy hover:text-primary">{n.title}</Link> : <p className="text-sm font-medium text-navy">{n.title}</p>}
                {n.body && <p className="text-sm text-slate-600">{n.body}</p>}
                <p className="mt-0.5 text-xs text-muted">{timeAgo(n.created_at)}</p>
              </div>
              {!n.read_at && <ActionButton variant="ghost" size="sm" action={() => markNotificationReadAction(n.id)}>Marquer comme lu</ActionButton>}
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
