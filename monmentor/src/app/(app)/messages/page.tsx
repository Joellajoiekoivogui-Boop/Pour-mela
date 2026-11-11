import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { relationsOf } from "@/lib/queries";
import { Avatar, EmptyState, PageHeader } from "@/components/ui";
import { relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await requireUser(["MENTOR", "MENTEE"]);
  const relations = (await relationsOf(user.id, user.role as "MENTOR" | "MENTEE")).filter((r) => r.m.status === "ACTIVE");
  const rows = await Promise.all(relations.map(async ({ person }) => {
    const [last] = await db.select().from(schema.messages).where(or(
      and(eq(schema.messages.senderId, user.id), eq(schema.messages.recipientId, person.id)),
      and(eq(schema.messages.senderId, person.id), eq(schema.messages.recipientId, user.id)),
    )).orderBy(desc(schema.messages.createdAt)).limit(1);
    const unread = (await db.select({ id: schema.messages.id }).from(schema.messages)
      .where(and(eq(schema.messages.senderId, person.id), eq(schema.messages.recipientId, user.id), isNull(schema.messages.readAt)))).length;
    return { person, last, unread };
  }));
  rows.sort((a, b) => (b.last?.createdAt ?? 0) - (a.last?.createdAt ?? 0));
  return (
    <>
      <PageHeader title="Messages" lead={user.role === "MENTEE" ? "Échangez avec vos mentors entre deux séances : une question, un document à relire, un encouragement." : "Échangez avec vos mentorés entre deux séances."} />
      {rows.length === 0 ? <EmptyState title="Aucune conversation.">La messagerie s&apos;ouvre dès qu&apos;un accompagnement est accepté.</EmptyState> : (
        <ul className="grid gap-2">
          {rows.map(({ person, last, unread }) => (
            <li key={person.id}>
              <Link href={`/messages/${person.id}`} className="card flex items-center gap-3 p-4 hover:border-accent">
                <Avatar name={person.name} />
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between gap-2"><span className="font-semibold">{person.name}</span>{last && <span className="text-xs text-ink-3">{relativeTime(last.createdAt)}</span>}</span>
                  <span className={`block truncate text-sm ${unread ? "font-semibold text-ink" : "text-ink-2"}`}>{last ? `${last.senderId === user.id ? "Vous : " : ""}${last.body}` : "Pas encore de message"}</span>
                </span>
                {unread > 0 && <span className="rounded-full bg-accent px-2 text-xs font-bold text-white">{unread}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
