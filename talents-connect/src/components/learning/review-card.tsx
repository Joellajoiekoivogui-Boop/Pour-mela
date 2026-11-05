"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Brain } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { markTakeawaysReviewedAction } from "@/lib/actions/appointments";

/**
 * Révision espacée par récupération : on demande d'abord de se rappeler
 * (sans voir les notes), puis on affiche les notes pour comparer.
 * Essayer de se souvenir consolide davantage que relire.
 */
export function ReviewCard({ appointmentId, topic, mentorName, takeaways, when }: { appointmentId: string; topic: string; mentorName: string; takeaways: string; when: string }) {
  const router = useRouter();
  const [revealed, setRevealed] = useState(false);
  const [pending, start] = useTransition();
  const finish = (remembered: boolean) => start(async () => {
    const r = await markTakeawaysReviewedAction(appointmentId);
    if (r.ok) { toast.success(remembered ? "Bien joué : ce souvenir est consolidé." : "Normal d'oublier un peu : cette relecture aide à retenir."); router.refresh(); }
    else toast.error(r.error);
  });
  return (
    <Card className="border-violet/30">
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-soft text-violet"><Brain className="size-4" /></span>
          <div>
            <p className="font-semibold text-navy">Petite révision (1 minute)</p>
            <p className="text-sm text-muted">Séance « {topic} » avec {mentorName}, {when}. Avant de regarder vos notes, essayez de vous rappeler ce que vous en avez retenu.</p>
          </div>
        </div>
        {revealed ? (
          <>
            <p className="whitespace-pre-line rounded-lg bg-violet-soft p-3 text-sm text-slate-700">{takeaways}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="success" loading={pending} onClick={() => finish(true)}>Je m&apos;en souvenais</Button>
              <Button size="sm" variant="secondary" loading={pending} onClick={() => finish(false)}>J&apos;avais oublié une partie</Button>
            </div>
          </>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setRevealed(true)}>J&apos;ai réfléchi, afficher mes notes</Button>
        )}
      </CardContent>
    </Card>
  );
}
