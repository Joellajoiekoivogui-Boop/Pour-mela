"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { respondToRequestAction } from "@/lib/actions/requests";

/** Accepter (ouvre le mentorat) ou refuser une demande, avec un message facultatif. */
export function RequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const respond = (accept: boolean) => start(async () => {
    if (!accept && !window.confirm("Refuser cette demande ?")) return;
    const r = await respondToRequestAction({ requestId, accept, message });
    if (r.ok) {
      toast.success(r.message);
      if (accept && r.data?.mentorshipId) router.push(`/mentor/mentorats/${r.data.mentorshipId}`);
      else router.refresh();
    } else toast.error(r.error);
  });
  return (
    <div className="space-y-2">
      <Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} placeholder="Message au mentoré (facultatif)" className="min-h-16" aria-label="Message de réponse" />
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" loading={pending} onClick={() => respond(false)}>Refuser</Button>
        <Button variant="success" loading={pending} onClick={() => respond(true)}>Accepter</Button>
      </div>
    </div>
  );
}
