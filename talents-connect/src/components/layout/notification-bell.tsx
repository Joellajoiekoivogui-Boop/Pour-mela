"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { getBrowserSupabase } from "@/lib/supabase/client";

/**
 * Cloche de notifications : compteur initial calculé côté serveur, puis mis à
 * jour en temps réel (Supabase Realtime, filtré par RLS sur l'utilisateur).
 */
export function NotificationBell({ userId, initialCount, href }: { userId: string; initialCount: number; href: string }) {
  const [count, setCount] = useState(initialCount);
  const [serverCount, setServerCount] = useState(initialCount);
  // Le serveur a recalculé le compteur (navigation, lecture) : on repart de sa valeur.
  if (serverCount !== initialCount) {
    setServerCount(initialCount);
    setCount(initialCount);
  }

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (payload) => {
        setCount((c) => c + 1);
        const n = payload.new as { title?: string; body?: string };
        if (n.title) toast(n.title, { description: n.body ?? undefined });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId]);

  return (
    <Link href={href} className="relative inline-flex size-10 items-center justify-center rounded-lg text-slate-600 hover:bg-subtle hover:text-foreground" aria-label={count > 0 ? `${count} notification(s) non lue(s)` : "Notifications"}>
      <Bell className="size-5" />
      {count > 0 && (
        <span className="absolute right-1.5 top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-4 text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
