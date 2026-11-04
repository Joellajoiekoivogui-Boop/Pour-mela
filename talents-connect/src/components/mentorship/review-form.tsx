"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { submitReviewAction } from "@/lib/actions/community";
import { cn } from "@/lib/utils";

export function ReviewForm({ mentorshipId }: { mentorshipId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3">
      <div className="flex gap-1" role="radiogroup" aria-label="Note sur 5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} sur 5`} onClick={() => setRating(n)}>
            <Star className={cn("size-7", n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
          </button>
        ))}
      </div>
      <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Qu'avez-vous apprécié ? (facultatif, public)" maxLength={1500} className="min-h-16" aria-label="Commentaire" />
      <Button size="sm" disabled={rating === 0} loading={pending} onClick={() => start(async () => {
        const r = await submitReviewAction({ mentorshipId, rating, comment });
        if (r.ok) { toast.success(r.message); router.refresh(); } else toast.error(r.error);
      })}>Publier mon évaluation</Button>
    </div>
  );
}
