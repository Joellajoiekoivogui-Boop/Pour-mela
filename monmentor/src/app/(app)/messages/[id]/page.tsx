import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, isNull, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { activeMentorship } from "@/lib/queries";
import { sendMessage } from "@/app/actions/messages";
import { Avatar, Notice } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { AutoRefresh } from "@/components/auto-refresh";
import { ReportButton } from "@/components/report-button";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Conversation" };

const ERRORS: Record<string, string> = {
  relation: "La messagerie n'est ouverte qu'avec vos mentors ou mentorés actifs.",
  nuit: "Pour les moins de 18 ans, la messagerie est fermée de 22 h à 6 h. Votre message pourra être envoyé demain matin.",
  rythme: "Vous envoyez beaucoup de messages. Patientez un peu.",
};

export default async function Conversation({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ erreur?: string }> }) {
  const user = await requireUser(["MENTOR", "MENTEE"]);
  const { id } = await params;
  const { erreur } = await searchParams;
  const [other] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  if (!other) notFound();
  const relation = await activeMentorship(user.id, id);
  const thread = await db.select().from(schema.messages).where(or(
    and(eq(schema.messages.senderId, user.id), eq(schema.messages.recipientId, id)),
    and(eq(schema.messages.senderId, id), eq(schema.messages.recipientId, user.id)),
  )).orderBy(asc(schema.messages.createdAt));
  await db.update(schema.messages).set({ readAt: Date.now() })
    .where(and(eq(schema.messages.senderId, id), eq(schema.messages.recipientId, user.id), isNull(schema.messages.readAt)));

  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      <AutoRefresh seconds={10} />
      <Link href="/messages" className="text-sm text-ink-2 hover:text-ink">← Messages</Link>
      <header className="card flex items-center gap-3 p-4">
        <Avatar name={other.name} />
        <div className="flex-1"><h1 className="font-semibold">{other.name}</h1><p className="text-xs text-ink-3">{other.role === "MENTOR" ? "Mentor" : "Mentoré·e"} · En direct</p></div>
        <ReportButton targetType="USER" targetId={other.id} targetUserId={other.id} />
      </header>
      {erreur && ERRORS[erreur] && <Notice tone="bad">{ERRORS[erreur]}</Notice>}
      <ol className="grid gap-2" aria-live="polite">
        {thread.length === 0 && <li className="text-center text-sm text-ink-3">Commencez la conversation.</li>}
        {thread.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`group max-w-[85%] rounded-2xl px-4 py-2 ${mine ? "bg-brand text-brand-ink" : "border border-line bg-surface"}`}>
                <p className="whitespace-pre-wrap text-sm">{m.body}</p>
                <p className={`mt-1 flex items-center gap-3 text-[11px] ${mine ? "opacity-70" : "text-ink-3"}`}>
                  {formatDateTime(m.createdAt)}
                  {!mine && <span className="opacity-0 group-hover:opacity-100 focus-within:opacity-100"><ReportButton targetType="MESSAGE" targetId={m.id} targetUserId={other.id} /></span>}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      {relation ? (
        <form action={sendMessage} className="card sticky bottom-3 flex items-end gap-2 p-3">
          <input type="hidden" name="to" value={other.id} />
          <label htmlFor="body" className="sr-only">Votre message</label>
          <textarea id="body" name="body" required rows={2} maxLength={4000} className="input min-h-11 flex-1 resize-y" placeholder="Votre message" />
          <SubmitButton pendingLabel="Envoi…">Envoyer</SubmitButton>
        </form>
      ) : <Notice tone="warn">Cette conversation est en lecture seule : l&apos;accompagnement n&apos;est plus actif.</Notice>}
    </div>
  );
}
