"use client";

import { ActionButton } from "@/components/shared/action-button";
import { handleReportAction } from "@/lib/actions/admin";

export function ReportActions({ id, status }: { id: string; status: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {status === "open" && <ActionButton size="sm" variant="secondary" action={() => handleReportAction(id, "reviewing", "")}>Examiner</ActionButton>}
      {(status === "open" || status === "reviewing") && (
        <>
          <ActionButton size="sm" variant="success" action={(note) => handleReportAction(id, "resolved", note)} prompt={{ label: "Mesure prise", placeholder: "Ex. : compte suspendu, avis masqué…", submitLabel: "Marquer résolu" }}>Résolu</ActionButton>
          <ActionButton size="sm" variant="ghost" action={(note) => handleReportAction(id, "dismissed", note)} prompt={{ label: "Motif du classement", submitLabel: "Classer sans suite" }}>Classer</ActionButton>
        </>
      )}
    </div>
  );
}
