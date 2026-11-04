import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { CalendarView } from "@/components/calendar/calendar-view";
import { AppointmentItem } from "@/components/mentorship/appointment-item";
import { SlotForm } from "@/components/mentorship/slot-form";
import { ActionButton } from "@/components/shared/action-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteSlotAction } from "@/lib/actions/appointments";
import { requireRole } from "@/lib/auth";
import { formatDateTime, formatTime } from "@/lib/dates";
import { SESSION_TYPE_LABELS } from "@/lib/labels";
import { getPeople } from "@/lib/queries";
import { fullName } from "@/lib/utils";
import type { Appointment, AvailabilitySlot, MentorProfile } from "@/types/db";

export const metadata: Metadata = { title: "Calendrier" };

export default async function MentorCalendarPage() {
  const { supabase, profile } = await requireRole(["mentor"]);
  const now = new Date().toISOString();
  const [appts, slots, mp] = await Promise.all([
    supabase.from("appointments").select("*").eq("mentor_id", profile.id).order("starts_at", { ascending: false }).limit(300),
    supabase.from("availability_slots").select("*").eq("mentor_id", profile.id).gt("starts_at", now).order("starts_at").limit(200),
    supabase.from("mentor_profiles").select("support_types").eq("user_id", profile.id).maybeSingle<Pick<MentorProfile, "support_types">>(),
  ]);
  const list = (appts.data ?? []) as Appointment[];
  const freeSlots = ((slots.data ?? []) as AvailabilitySlot[]).filter((s) => !s.is_booked);
  const people = await getPeople(supabase, list.map((a) => a.mentee_id));
  const pending = list.filter((a) => a.status === "pending" && a.starts_at > now).reverse();
  const confirmed = list.filter((a) => a.status === "confirmed").reverse();

  return (
    <>
      <PageHeader title="Calendrier" description="Publiez vos disponibilités, confirmez les réservations et suivez vos séances (heure de Conakry)." />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <CalendarView events={[
            ...list.map((a) => ({ id: a.id, title: `${fullName(people.get(a.mentee_id))}${a.topic ? ` · ${a.topic}` : ""}`, start: a.starts_at, end: a.ends_at, kind: a.status })),
            ...freeSlots.map((s) => ({ id: s.id, title: "Créneau libre", start: s.starts_at, end: s.ends_at, kind: "slot" as const })),
          ]} />
          <Card>
            <CardHeader><CardTitle>À confirmer ({pending.length})</CardTitle></CardHeader>
            <CardContent className="space-y-3">{pending.length === 0 ? <p className="text-sm text-muted">Aucune réservation en attente.</p> : pending.map((a) => <AppointmentItem key={a.id} appointment={a} other={people.get(a.mentee_id)} viewer="mentor" />)}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Séances confirmées</CardTitle><CardDescription>Une fois la séance passée, marquez-la comme réalisée et ajoutez vos notes.</CardDescription></CardHeader>
            <CardContent className="space-y-3">{confirmed.length === 0 ? <p className="text-sm text-muted">Aucune séance confirmée.</p> : confirmed.map((a) => <AppointmentItem key={a.id} appointment={a} other={people.get(a.mentee_id)} viewer="mentor" />)}</CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Publier des créneaux</CardTitle></CardHeader>
            <CardContent><SlotForm defaultTypes={mp.data?.support_types ?? []} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Créneaux libres ({freeSlots.length})</CardTitle></CardHeader>
            <CardContent>
              {freeSlots.length === 0 ? <p className="text-sm text-muted">Aucun créneau libre à venir.</p> : (
                <ul className="divide-y divide-border">
                  {freeSlots.slice(0, 30).map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 py-2.5">
                      <div className="text-sm"><p className="font-medium">{formatDateTime(s.starts_at)} – {formatTime(s.ends_at)}</p><p className="text-xs text-muted">{s.session_types.map((t) => SESSION_TYPE_LABELS[t]).join(", ")}</p></div>
                      <ActionButton size="sm" variant="danger-ghost" action={() => deleteSlotAction(s.id)} aria-label="Supprimer le créneau">Retirer</ActionButton>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
