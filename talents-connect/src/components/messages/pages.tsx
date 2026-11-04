import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ReportButton } from "@/components/shared/report-button";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { timeAgo } from "@/lib/dates";
import { getPeople } from "@/lib/queries";
import { cn, fullName } from "@/lib/utils";
import type { Session } from "@/lib/auth";
import type { Message, Mentorship, PersonSummary } from "@/types/db";
import { Chat } from "./chat";

type ConversationRow = { id: string; last_message_at: string | null; mentorship: Pick<Mentorship, "id" | "mentor_id" | "mentee_id" | "status"> | null };

/** Liste des conversations de l'utilisateur, avec indicateur de messages non lus. */
export async function ConversationsPage({ session, basePath }: { session: Session; basePath: string }) {
  const { supabase, user } = session;
  const { data: memberships } = await supabase.from("conversation_members").select("conversation_id, last_read_at").eq("user_id", user.id);
  const reads = new Map(((memberships ?? []) as { conversation_id: string; last_read_at: string }[]).map((m) => [m.conversation_id, m.last_read_at]));
  const ids = [...reads.keys()];
  const { data } = ids.length
    ? await supabase.from("conversations").select("id, last_message_at, mentorship:mentorships(id, mentor_id, mentee_id, status)").in("id", ids).order("last_message_at", { ascending: false, nullsFirst: false })
    : { data: [] };
  const list = (data ?? []) as unknown as ConversationRow[];
  const others = list.map((c) => (c.mentorship?.mentor_id === user.id ? c.mentorship?.mentee_id : c.mentorship?.mentor_id));
  const people = await getPeople(supabase, others);

  return (
    <>
      <PageHeader title="Messagerie" description="Une conversation privée est ouverte avec chaque mentorat accepté." />
      {list.length === 0 ? (
        <EmptyState icon={MessageSquare} title="Aucune conversation" description="La conversation s'ouvre automatiquement lorsqu'une demande de mentorat est acceptée." />
      ) : (
        <Card className="divide-y divide-border">
          {list.map((c, i) => {
            const other = people.get(others[i] ?? "");
            const unread = c.last_message_at && (!reads.get(c.id) || c.last_message_at > reads.get(c.id)!);
            return (
              <Link key={c.id} href={`${basePath}/messages/${c.id}`} className="flex items-center gap-3 p-4 hover:bg-subtle/60">
                <Avatar person={other} />
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate", unread ? "font-semibold text-navy" : "font-medium")}>{fullName(other)}</p>
                  <p className="text-xs text-muted">{c.last_message_at ? `Dernier message ${timeAgo(c.last_message_at)}` : "Pas encore de message"}{c.mentorship?.status !== "active" ? " · mentorat terminé" : ""}</p>
                </div>
                {unread && <span className="inline-flex size-2.5 rounded-full bg-primary" aria-label="Nouveaux messages" />}
              </Link>
            );
          })}
        </Card>
      )}
    </>
  );
}

export async function ConversationPage({ session, basePath, id }: { session: Session; basePath: string; id: string }) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, user } = session;
  const { data: conv } = await supabase.from("conversations").select("id, mentorship:mentorships(id, mentor_id, mentee_id, status)").eq("id", id).maybeSingle();
  const row = conv as unknown as ConversationRow | null;
  if (!row?.mentorship) notFound();
  const { data: msgs } = await supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: false }).limit(200);
  const messages = ((msgs ?? []) as Message[]).reverse();
  const otherId = row.mentorship.mentor_id === user.id ? row.mentorship.mentee_id : row.mentorship.mentor_id;
  const people = await getPeople(supabase, [row.mentorship.mentor_id, row.mentorship.mentee_id]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`${basePath}/messages`} className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-subtle" aria-label="Retour aux conversations"><ArrowLeft className="size-4" /></Link>
          <Avatar person={people.get(otherId)} />
          <div>
            <h1 className="font-semibold text-navy">{fullName(people.get(otherId))}</h1>
            <Link href={`${basePath}/mentorats/${row.mentorship.id}`} className="text-xs text-primary hover:underline">Voir le mentorat</Link>
          </div>
        </div>
        <ReportButton targetType="user" targetUserId={otherId} />
      </div>
      <Chat conversationId={id} me={user.id} people={Object.fromEntries(people) as Record<string, PersonSummary>} initialMessages={messages} readOnly={row.mentorship.status !== "active"} />
    </>
  );
}
