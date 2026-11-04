"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { bookAppointmentAction } from "@/lib/actions/appointments";
import { dayKey, formatDate, formatTime } from "@/lib/dates";
import { SESSION_TYPE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { AvailabilitySlot, SessionType } from "@/types/db";

/** Réservation d'un créneau libre du mentor, groupés par jour (heure de Conakry). */
export function BookingForm({ mentorshipId, slots }: { mentorshipId: string; slots: AvailabilitySlot[] }) {
  const router = useRouter();
  const [slotId, setSlotId] = useState<string | null>(null);
  const [type, setType] = useState<SessionType | "">("");
  const [topic, setTopic] = useState("");
  const [pending, start] = useTransition();
  const slot = slots.find((s) => s.id === slotId);
  const byDay = useMemo(() => {
    const map = new Map<string, AvailabilitySlot[]>();
    for (const s of slots) map.set(dayKey(s.starts_at), [...(map.get(dayKey(s.starts_at)) ?? []), s]);
    return [...map.entries()];
  }, [slots]);

  if (slots.length === 0) return <p className="text-sm text-muted">Votre mentor n&apos;a pas de créneau libre pour le moment. Écrivez-lui via la messagerie pour convenir d&apos;une date.</p>;

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {byDay.map(([day, list]) => (
          <div key={day}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{formatDate(list[0]!.starts_at)}</p>
            <div className="flex flex-wrap gap-2">
              {list.map((s) => (
                <button key={s.id} type="button" onClick={() => { setSlotId(s.id); setType(s.session_types[0] ?? ""); }} aria-pressed={slotId === s.id}
                  className={cn("rounded-lg border px-3 py-2 text-sm transition-colors", slotId === s.id ? "border-primary bg-primary text-white" : "border-border hover:border-primary/50 hover:bg-primary-soft")}>
                  {formatTime(s.starts_at)} – {formatTime(s.ends_at)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {slot && (
        <div className="grid gap-4 rounded-lg bg-subtle/60 p-4 sm:grid-cols-2">
          <Field label="Type de séance" htmlFor="booking-type">
            <Select id="booking-type" value={type} onChange={(e) => setType(e.target.value as SessionType)}>
              {slot.session_types.map((t) => <option key={t} value={t}>{SESSION_TYPE_LABELS[t]}</option>)}
            </Select>
          </Field>
          <Field label="Sujet de la séance" htmlFor="booking-topic">
            <Input id="booking-topic" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={300} placeholder="Ex. : relecture de mon CV" />
          </Field>
          <Button className="sm:col-span-2" loading={pending} disabled={!type} onClick={() => start(async () => {
            const r = await bookAppointmentAction({ slotId: slot.id, mentorshipId, sessionType: type, topic });
            if (r.ok) { toast.success(r.message); setSlotId(null); setTopic(""); router.refresh(); } else toast.error(r.error);
          })}>
            Réserver le {formatDate(slot.starts_at)} à {formatTime(slot.starts_at)}
          </Button>
        </div>
      )}
    </div>
  );
}
