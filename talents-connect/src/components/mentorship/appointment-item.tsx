"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Link2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { ActionButton } from "@/components/shared/action-button";
import { AppointmentBadge } from "@/components/shared/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import {
  cancelAppointmentAction, completeAppointmentAction, confirmAppointmentAction, rescheduleAppointmentAction,
} from "@/lib/actions/appointments";
import { formatDateTime, formatTime } from "@/lib/dates";
import { SESSION_TYPE_LABELS } from "@/lib/labels";
import { fullName } from "@/lib/utils";
import type { Appointment, AvailabilitySlot, PersonSummary } from "@/types/db";

/** Une séance, avec les actions permises selon le rôle et le statut. */
export function AppointmentItem({ appointment: a, other, viewer, freeSlots = [] }: {
  appointment: Appointment; other?: PersonSummary; viewer: "mentee" | "mentor"; freeSlots?: AvailabilitySlot[];
}) {
  const router = useRouter();
  const [rescheduling, setRescheduling] = useState(false);
  const [slotId, setSlotId] = useState("");
  const [pending, start] = useTransition();
  const [now] = useState(() => Date.now());
  const future = new Date(a.starts_at).getTime() > now;
  const started = !future;
  const open = a.status === "pending" || a.status === "confirmed";
  const isUrl = a.location_or_link && /^https?:\/\//i.test(a.location_or_link);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-start">
      {other && <Avatar person={other} size="sm" />}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-navy">{a.topic || "Séance de mentorat"}</p>
          <AppointmentBadge status={a.status} />
          {a.rescheduled_from && <span className="text-xs text-muted">(reprogrammée)</span>}
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
          <CalendarClock className="size-3.5 text-slate-400" aria-hidden />
          {formatDateTime(a.starts_at)} – {formatTime(a.ends_at)} · {SESSION_TYPE_LABELS[a.session_type]}
        </p>
        {other && <p className="text-xs text-muted">Avec {fullName(other)} · heure de Conakry (GMT)</p>}
        {a.location_or_link && (
          <p className="mt-1 flex items-center gap-1.5 text-sm">
            {isUrl ? <Link2 className="size-3.5 text-slate-400" aria-hidden /> : <MapPin className="size-3.5 text-slate-400" aria-hidden />}
            {isUrl ? <a href={a.location_or_link} target="_blank" rel="noopener noreferrer" className="truncate text-primary underline">{a.location_or_link}</a> : a.location_or_link}
          </p>
        )}
        {a.cancel_reason && <p className="mt-1 text-xs text-muted">Motif : {a.cancel_reason}</p>}
        {a.mentor_notes && <p className="mt-2 rounded-md bg-subtle p-2.5 text-sm text-slate-700"><span className="font-medium">Notes de séance : </span>{a.mentor_notes}</p>}

        {rescheduling && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Select value={slotId} onChange={(e) => setSlotId(e.target.value)} aria-label="Nouveau créneau" className="sm:max-w-xs">
              <option value="">— Choisir un nouveau créneau —</option>
              {freeSlots.filter((s) => s.session_types.includes(a.session_type)).map((s) => <option key={s.id} value={s.id}>{formatDateTime(s.starts_at)}</option>)}
            </Select>
            <Button size="sm" loading={pending} disabled={!slotId} onClick={() => start(async () => {
              const r = await rescheduleAppointmentAction(a.id, slotId);
              if (r.ok) { toast.success(r.message); setRescheduling(false); router.refresh(); } else toast.error(r.error);
            })}>Confirmer</Button>
            <Button size="sm" variant="ghost" onClick={() => setRescheduling(false)}>Annuler</Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 sm:max-w-[260px] sm:justify-end">
        {viewer === "mentor" && a.status === "pending" && (
          <ActionButton size="sm" variant="success" action={(t) => confirmAppointmentAction(a.id, t)} prompt={{ label: a.session_type === "in_person" ? "Lieu du rendez-vous" : "Lien de visioconférence ou numéro (facultatif)", placeholder: a.session_type === "in_person" ? "Adresse à Conakry" : "https://meet…", submitLabel: "Confirmer la séance" }}>
            Confirmer
          </ActionButton>
        )}
        {viewer === "mentor" && a.status === "confirmed" && started && (
          <ActionButton size="sm" action={(t) => completeAppointmentAction(a.id, t)} prompt={{ label: "Notes de séance (visibles par le mentoré)", placeholder: "Points abordés, prochaines étapes…", submitLabel: "Marquer comme réalisée" }}>
            Séance réalisée
          </ActionButton>
        )}
        {viewer === "mentee" && open && future && freeSlots.length > 0 && !rescheduling && (
          <Button size="sm" variant="secondary" onClick={() => setRescheduling(true)}>Reprogrammer</Button>
        )}
        {open && future && (
          <ActionButton size="sm" variant="danger-ghost" action={(t) => cancelAppointmentAction(a.id, t)} prompt={{ label: "Motif de l'annulation", placeholder: "Facultatif, transmis à l'autre participant", submitLabel: "Annuler la séance" }}>
            Annuler
          </ActionButton>
        )}
      </div>
    </div>
  );
}
