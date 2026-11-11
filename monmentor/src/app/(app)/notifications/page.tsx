import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { markNotificationsRead } from "@/lib/notify";
import { EmptyState, PageHeader } from "@/components/ui";
import { relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await db.select().from(schema.notifications)
    .where(and(eq(schema.notifications.userId, user.id), eq(schema.notifications.channel, "inapp")))
    .orderBy(desc(schema.notifications.createdAt)).limit(50);
  await markNotificationsRead(user.id);
  return (
    <>
      <PageHeader title="Notifications" lead="Les rappels de séance vous sont aussi envoyés par WhatsApp, SMS ou e-mail, selon vos préférences." actions={<Link href="/profil#preferences" className="btn-ghost btn-sm">Mes préférences</Link>} />
      {items.length === 0 ? <EmptyState title="Aucune notification." /> : (
        <ul className="grid gap-2">
          {items.map((n) => (
            <li key={n.id}>
              <Link href={n.link ?? "#"} className={`card flex items-start justify-between gap-3 p-4 hover:border-accent ${n.readAt ? "" : "border-accent/50"}`}>
                <span className={n.readAt ? "text-ink-2" : "font-semibold"}>{n.body}</span>
                <span className="shrink-0 text-xs text-ink-3">{relativeTime(n.createdAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
