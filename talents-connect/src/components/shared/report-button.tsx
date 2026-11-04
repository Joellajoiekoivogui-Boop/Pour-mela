"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import { submitReportAction } from "@/lib/actions/community";

const REASONS = ["Comportement inapproprié", "Profil frauduleux ou usurpé", "Sollicitation commerciale", "Contenu offensant", "Autre"];

/** Signalement d'un utilisateur ou d'un contenu à l'équipe de modération. */
export function ReportButton({ targetType, targetId, targetUserId }: { targetType: "user" | "message" | "resource" | "opportunity" | "review"; targetId?: string; targetUserId?: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]!);
  const [details, setDetails] = useState("");
  const [pending, start] = useTransition();

  if (!open) return <Button variant="ghost" size="sm" className="text-muted" onClick={() => setOpen(true)}><Flag /> Signaler</Button>;
  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface p-4 text-left">
      <Field label="Motif" htmlFor="report-reason">
        <Select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r}>{r}</option>)}</Select>
      </Field>
      <Field label="Précisions (facultatif)" htmlFor="report-details"><Textarea id="report-details" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={2000} className="min-h-16" /></Field>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
        <Button size="sm" variant="danger" loading={pending} onClick={() => start(async () => {
          const r = await submitReportAction({ targetType, targetId, targetUserId, reason, details });
          if (r.ok) { toast.success(r.message); setOpen(false); setDetails(""); } else toast.error(r.error);
        })}>Envoyer le signalement</Button>
      </div>
    </div>
  );
}
