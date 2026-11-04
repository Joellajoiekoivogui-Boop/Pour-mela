"use client";

import { useMemo, useState } from "react";
import { TZDate } from "@date-fns/tz";
import {
  addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_TIME_ZONE, dayKey, formatTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  kind: "pending" | "confirmed" | "completed" | "cancelled" | "slot";
}

const KIND_STYLES: Record<CalendarEvent["kind"], string> = {
  pending: "bg-warning-soft text-amber-800 border-amber-200",
  confirmed: "bg-primary-soft text-blue-800 border-blue-200",
  completed: "bg-success-soft text-green-800 border-green-200",
  cancelled: "bg-subtle text-slate-500 line-through border-border",
  slot: "bg-white text-slate-600 border-dashed border-slate-300",
};
const KIND_LABELS: Record<CalendarEvent["kind"], string> = {
  pending: "À confirmer", confirmed: "Confirmé", completed: "Réalisé", cancelled: "Annulé", slot: "Créneau libre",
};

/** Calendrier mensuel / hebdomadaire. Les jours sont calculés dans le fuseau de Conakry. */
export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const [view, setView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(() => new TZDate(Date.now(), APP_TIME_ZONE));
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of [...events].sort((a, b) => a.start.localeCompare(b.start))) map.set(dayKey(e.start), [...(map.get(dayKey(e.start)) ?? []), e]);
    return map;
  }, [events]);
  const today = dayKey(new Date());

  const days = view === "month"
    ? eachDayOfInterval({ start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }) })
    : eachDayOfInterval({ start: startOfWeek(cursor, { weekStartsOn: 1 }), end: endOfWeek(cursor, { weekStartsOn: 1 }) });
  const move = (dir: 1 | -1) => setCursor((c) => (view === "month" ? addMonths(c, dir) : addWeeks(c, dir)));
  const title = view === "month"
    ? format(cursor, "MMMM yyyy", { locale: fr })
    : `${format(days[0]!, "d MMM", { locale: fr })} – ${format(days[6]!, "d MMM yyyy", { locale: fr })}`;

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => move(-1)} aria-label="Période précédente"><ChevronLeft /></Button>
          <Button variant="ghost" size="icon" onClick={() => move(1)} aria-label="Période suivante"><ChevronRight /></Button>
          <h2 className="ml-2 text-base font-semibold capitalize text-navy" aria-live="polite">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setCursor(new TZDate(Date.now(), APP_TIME_ZONE))}>Aujourd&apos;hui</Button>
          <div className="inline-flex rounded-lg border border-border p-0.5" role="group" aria-label="Affichage">
            {(["month", "week"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} className={cn("rounded-md px-3 py-1 text-sm", view === v ? "bg-navy text-white" : "text-slate-600 hover:bg-subtle")}>
                {v === "month" ? "Mois" : "Semaine"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-border text-center text-xs font-medium text-muted">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>
      <div className={cn("grid grid-cols-7", view === "week" && "min-h-80")}>
        {days.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const list = byDay.get(key) ?? [];
          const muted = view === "month" && !isSameMonth(d, cursor);
          return (
            <div key={key} className={cn("min-h-20 border-b border-r border-border p-1 sm:min-h-24 sm:p-1.5 [&:nth-child(7n)]:border-r-0", muted && "bg-subtle/50", view === "week" && "min-h-64")}>
              <p className={cn("mb-1 text-right text-xs", key === today ? "font-semibold text-primary" : muted ? "text-slate-400" : "text-slate-600")}>
                {key === today ? <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-white">{format(d, "d")}</span> : format(d, "d")}
              </p>
              <ul className="space-y-1">
                {list.slice(0, view === "month" ? 3 : 12).map((e) => (
                  <li key={e.id} title={`${formatTime(e.start)} – ${formatTime(e.end)} · ${e.title} (${KIND_LABELS[e.kind]})`} className={cn("truncate rounded border px-1 py-0.5 text-[10px] leading-tight sm:text-[11px]", KIND_STYLES[e.kind])}>
                    <span className="font-medium">{formatTime(e.start)}</span><span className="hidden sm:inline"> {e.title}</span>
                  </li>
                ))}
                {view === "month" && list.length > 3 && <li className="px-1 text-[10px] text-muted">+{list.length - 3}</li>}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 p-3 text-xs text-muted">
        {(Object.keys(KIND_LABELS) as CalendarEvent["kind"][]).map((k) => <span key={k} className="inline-flex items-center gap-1.5"><span className={cn("size-3 rounded border", KIND_STYLES[k])} />{KIND_LABELS[k]}</span>)}
        <span className="ml-auto">Heure de Conakry (GMT)</span>
      </div>
    </div>
  );
}

