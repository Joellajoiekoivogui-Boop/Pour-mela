import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CalendarView } from "@/components/calendar/calendar-view";
import { AppointmentItem } from "@/components/mentorship/appointment-item";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { requireRole } from "@/lib/auth";
import { getPeople } from "@/lib/queries";
import { fullName } from "@/lib/utils";
import type { Appointment, AvailabilitySlot } from "@/types/db";

export const metadata: Metadata = { title: "Mes rendez-vous" };

export default async function MenteeAppointmentsPage() {
  const { supabase, profile } = await requireRole(["mentee"]);
  const { data } = await supabase.from("appointments").select("*").eq("mentee_id", profile.id).order("starts_at", { ascending: false }).limit(200);
  const list = (data ?? []) as Appointment[];
  const mentorIds = [...new Set(list.map((a) => a.mentor_id))];
  const [people, slots] = await Promise.all([
    getPeople(supabase, mentorIds),
    mentorIds.length
      ? supabase.from("availability_slots").select("*").in("mentor_id", mentorIds).eq("is_booked", false).gt("starts_at", new Date().toISOString()).order("starts_at")
      : Promise.resolve({ data: [] }),
  ]);
  const freeSlots = (slots.data ?? []) as AvailabilitySlot[];
  const now = new Date();
  const upcoming = list.filter((a) => new Date(a.starts_at) > now && ["pending", "confirmed"].includes(a.status)).reverse();
  const past = list.filter((a) => !upcoming.includes(a));

  return (
    <>
      <PageHeader title="Mes rendez-vous" description="Toutes vos séances de mentorat, à l'heure de Conakry." actions={<ButtonLink href="/mentore/mentorats" variant="secondary">Réserver depuis un mentorat</ButtonLink>} />
      {list.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Aucun rendez-vous" description="Ouvrez un mentorat actif pour réserver un créneau proposé par votre mentor." action={<ButtonLink href="/mentore/mentorats">Mes mentorats</ButtonLink>} />
      ) : (
        <div className="space-y-6">
          <CalendarView events={list.map((a) => ({ id: a.id, title: a.topic || `Séance · ${fullName(people.get(a.mentor_id))}`, start: a.starts_at, end: a.ends_at, kind: a.status }))} />
          <Card>
            <CardHeader><CardTitle>À venir</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {upcoming.length === 0 ? <p className="text-sm text-muted">Aucune séance à venir.</p> : upcoming.map((a) => (
                <AppointmentItem key={a.id} appointment={a} other={people.get(a.mentor_id)} viewer="mentee" freeSlots={freeSlots.filter((s) => s.mentor_id === a.mentor_id)} />
              ))}
            </CardContent>
          </Card>
          {past.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Historique</CardTitle></CardHeader>
              <CardContent className="space-y-3">{past.map((a) => <AppointmentItem key={a.id} appointment={a} other={people.get(a.mentor_id)} viewer="mentee" />)}</CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
