"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Paperclip, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { attachmentUrlAction, markConversationReadAction, sendMessageAction } from "@/lib/actions/messages";
import { dayKey, formatDate, formatTime } from "@/lib/dates";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { cn, fullName } from "@/lib/utils";
import type { Message, PersonSummary } from "@/types/db";

const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]])/g;

/** Rend les liens cliquables sans interpréter de HTML (pas de dangerouslySetInnerHTML). */
function Linkified({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return <>{parts.map((p, i) => (i % 2 === 1 ? <a key={i} href={p} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline">{p}</a> : p))}</>;
}

function Attachment({ path, name, mine }: { path: string; name: string | null; mine: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} className={cn("mt-1 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs underline", mine ? "bg-white/15" : "bg-subtle")}
      onClick={() => start(async () => { const r = await attachmentUrlAction(path); if (r.ok && r.data) window.open(r.data.url, "_blank", "noopener"); else if (!r.ok) toast.error(r.error); })}>
      <Paperclip className="size-3" aria-hidden />{name ?? "Pièce jointe"}
    </button>
  );
}

export function Chat({ conversationId, me, people, initialMessages, readOnly }: {
  conversationId: string; me: string; people: Record<string, PersonSummary>; initialMessages: Message[]; readOnly: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, start] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => { bottom.current?.scrollIntoView({ block: "end" }); }, [messages.length]);
  useEffect(() => { void markConversationReadAction(conversationId); }, [conversationId]);

  // Temps réel : nouveaux messages de la conversation (RLS appliquée par Supabase).
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const msg = payload.new as Message;
        setMessages((list) => (list.some((m) => m.id === msg.id) ? list : [...list, msg]));
        if (msg.sender_id !== me) void markConversationReadAction(conversationId);
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [conversationId, me]);

  const send = () => start(async () => {
    const fd = new FormData();
    fd.set("conversationId", conversationId);
    fd.set("body", body);
    if (file) fd.set("file", file);
    const r = await sendMessageAction(fd);
    if (r.ok && r.data) {
      setMessages((list) => (list.some((m) => m.id === r.data!.message.id) ? list : [...list, r.data!.message]));
      setBody("");
      setFile(null);
    } else if (!r.ok) toast.error(r.error);
  });

  return (
    <div className="flex h-[calc(100dvh-13rem)] min-h-[420px] flex-col rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card)]">
      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite" aria-label="Messages">
        {messages.length === 0 && <p className="py-10 text-center text-sm text-muted">Aucun message. Présentez-vous et proposez un premier échange !</p>}
        {messages.map((m, i) => {
          const mine = m.sender_id === me;
          const showDay = i === 0 || dayKey(m.created_at) !== dayKey(messages[i - 1]!.created_at);
          return (
            <div key={m.id}>
              {showDay && <p className="my-3 text-center text-xs text-muted">{formatDate(m.created_at)}</p>}
              <div className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
                {!mine && <Avatar person={people[m.sender_id]} size="sm" />}
                <div className={cn("max-w-[80%] rounded-2xl px-3.5 py-2 text-sm", mine ? "rounded-br-md bg-primary text-white" : "rounded-bl-md bg-subtle text-foreground")}>
                  {!mine && <p className="mb-0.5 text-xs font-medium text-slate-500">{fullName(people[m.sender_id])}</p>}
                  {m.body && <p className="whitespace-pre-wrap break-words"><Linkified text={m.body} /></p>}
                  {m.attachment_path && <Attachment path={m.attachment_path} name={m.attachment_name} mine={mine} />}
                  <p className={cn("mt-1 text-right text-[10px]", mine ? "text-blue-100" : "text-slate-400")}>{formatTime(m.created_at)}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      {readOnly ? (
        <p className="border-t border-border p-4 text-center text-sm text-muted">Ce mentorat est terminé : la conversation est en lecture seule.</p>
      ) : (
        <form className="border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); if (body.trim() || file) send(); }}>
          {file && (
            <p className="mb-2 inline-flex items-center gap-2 rounded-md bg-subtle px-2 py-1 text-xs">
              <Paperclip className="size-3" aria-hidden />{file.name}
              <button type="button" onClick={() => setFile(null)} aria-label="Retirer le fichier"><X className="size-3" /></button>
            </p>
          )}
          <div className="flex items-end gap-2">
            <input ref={fileInput} type="file" className="sr-only" accept="application/pdf,image/jpeg,image/png,image/webp,text/plain,.docx" aria-label="Joindre un fichier"
              onChange={(e) => { const f = e.target.files?.[0]; if (f && f.size > 5 * 1024 * 1024) toast.error("Fichier trop lourd (5 Mo maximum)."); else setFile(f ?? null); e.target.value = ""; }} />
            <Button type="button" variant="ghost" size="icon" onClick={() => fileInput.current?.click()} aria-label="Joindre un fichier"><Paperclip /></Button>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Écrire un message…" className="max-h-32 min-h-10 resize-none py-2" rows={1} maxLength={4000} aria-label="Message"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (body.trim() || file) send(); } }} />
            <Button type="submit" size="icon" loading={pending} disabled={!body.trim() && !file} aria-label="Envoyer">{!pending && <Send />}</Button>
          </div>
          <p className="mt-1.5 text-[11px] text-muted">Entrée pour envoyer · Maj+Entrée pour aller à la ligne · PDF, image, Word ou texte, 5 Mo max.</p>
        </form>
      )}
    </div>
  );
}
