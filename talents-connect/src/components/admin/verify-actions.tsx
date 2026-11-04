"use client";

import { ActionButton } from "@/components/shared/action-button";
import { verifyMentorAction } from "@/lib/actions/admin";

export function VerifyActions({ userId, status }: { userId: string; status: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "verified" && <ActionButton size="sm" variant="success" confirm="Valider ce profil ? Il deviendra visible publiquement." action={() => verifyMentorAction({ userId, approve: true })}>Valider</ActionButton>}
      {status !== "rejected" && (
        <ActionButton size="sm" variant="danger-ghost" action={(reason) => verifyMentorAction({ userId, approve: false, reason })} prompt={{ label: "Motif du refus (transmis au mentor)", required: true, submitLabel: status === "verified" ? "Retirer la vérification" : "Refuser" }}>
          {status === "verified" ? "Retirer la vérification" : "Refuser"}
        </ActionButton>
      )}
    </div>
  );
}
