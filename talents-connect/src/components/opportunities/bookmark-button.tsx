"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { toggleBookmarkAction } from "@/lib/actions/content";
import { cn } from "@/lib/utils";

export function BookmarkButton({ opportunityId, saved }: { opportunityId: string; saved: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [on, setOn] = useOptimistic(saved);
  return (
    <button type="button" disabled={pending} aria-pressed={on} aria-label={on ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={cn("inline-flex size-9 items-center justify-center rounded-lg border transition-colors", on ? "border-primary bg-primary-soft text-primary" : "border-border text-slate-500 hover:bg-subtle")}
      onClick={() => start(async () => { setOn(!on); const r = await toggleBookmarkAction(opportunityId, !on); if (!r.ok) toast.error(r.error); router.refresh(); })}>
      <Bookmark className={cn("size-4", on && "fill-current")} />
    </button>
  );
}
