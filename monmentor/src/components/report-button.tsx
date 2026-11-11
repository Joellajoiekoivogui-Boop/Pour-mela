"use client";
import { useActionState } from "react";
import { createReport, type ReportState } from "@/app/actions/reports";
import { SubmitButton } from "./submit-button";

const REASONS = [
  ["HARASSMENT", "Harcèlement ou propos déplacés"],
  ["SCAM", "Demande d'argent ou arnaque"],
  ["INAPPROPRIATE", "Contenu inapproprié"],
  ["FAKE_PROFILE", "Faux profil"],
  ["OTHER", "Autre"],
] as const;

export function ReportButton({ targetType, targetId, targetUserId, label = "Signaler" }: { targetType: string; targetId: string; targetUserId?: string; label?: string }) {
  const [state, action] = useActionState<ReportState, FormData>(createReport, {});
  return (
    <details className="group relative">
      <summary className="cursor-pointer list-none text-xs font-semibold text-ink-3 hover:text-bad">⚑ {label}</summary>
      <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-line bg-surface p-4 shadow-xl">
        {state.ok ? (
          <p className="text-sm text-ok" role="status">Merci. La coordination examine votre signalement sous 48 h. La personne signalée ne saura pas qui l&apos;a signalée.</p>
        ) : (
          <form action={action} className="grid gap-3">
            <input type="hidden" name="targetType" value={targetType} />
            <input type="hidden" name="targetId" value={targetId} />
            {targetUserId && <input type="hidden" name="targetUserId" value={targetUserId} />}
            <label className="field"><span className="label">Motif</span>
              <select name="reason" className="input" required defaultValue="">
                <option value="" disabled>Choisir…</option>
                {REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="field"><span className="label">Détails (facultatif)</span><textarea name="details" rows={3} className="input" maxLength={1000} /></label>
            {state.error && <p className="text-sm text-bad" role="alert">{state.error}</p>}
            <SubmitButton className="btn-danger btn-sm">Envoyer le signalement</SubmitButton>
          </form>
        )}
      </div>
    </details>
  );
}
