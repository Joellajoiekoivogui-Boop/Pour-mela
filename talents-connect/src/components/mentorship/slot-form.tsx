"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Alert } from "@/components/ui/misc";
import { useServerForm } from "@/components/forms/use-server-form";
import { createSlotsAction } from "@/lib/actions/appointments";
import { SESSION_TYPE_LABELS, SESSION_TYPES } from "@/lib/labels";
import { slotSchema } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";
import type { SessionType } from "@/types/db";

type Values = z.input<typeof slotSchema>;

/** Publication de créneaux par le mentor (heures saisies à Conakry, répétition hebdomadaire possible). */
export function SlotForm({ defaultTypes }: { defaultTypes: SessionType[] }) {
  const router = useRouter();
  const [today, tomorrow] = useState(() => [0, 1].map((d) => new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10)))[0] as [string, string];
  const form = useForm<Values, unknown, z.output<typeof slotSchema>>({
    resolver: zodResolver(slotSchema),
    defaultValues: { date: tomorrow, startTime: "10:00", durationMinutes: 60, sessionTypes: defaultTypes.length ? defaultTypes : ["video"], repeatWeeks: 1 },
  });
  const { onSubmit, pending, error } = useServerForm(form, createSlotsAction, { onSuccess: () => router.refresh() });
  const { errors } = form.formState;
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" htmlFor="slot-date" error={errors.date?.message}><Input id="slot-date" type="date" min={today} {...form.register("date")} /></Field>
        <Field label="Heure (Conakry)" htmlFor="slot-time" error={errors.startTime?.message}><Input id="slot-time" type="time" step={900} {...form.register("startTime")} /></Field>
        <Field label="Durée" htmlFor="slot-duration">
          <Select id="slot-duration" {...form.register("durationMinutes")}>{[30, 45, 60, 90, 120].map((d) => <option key={d} value={d}>{d} min</option>)}</Select>
        </Field>
        <Field label="Répéter" htmlFor="slot-repeat">
          <Select id="slot-repeat" {...form.register("repeatWeeks")}>{[1, 2, 4, 8, 12].map((w) => <option key={w} value={w}>{w === 1 ? "Une seule fois" : `${w} semaines`}</option>)}</Select>
        </Field>
      </div>
      <Field label="Types de séance proposés" htmlFor="slot-types" error={errors.sessionTypes?.message}>
        <Controller control={form.control} name="sessionTypes" render={({ field }) => {
          const value = (field.value ?? []) as string[];
          return (
            <div className="grid grid-cols-2 gap-2">
              {SESSION_TYPES.map((t) => {
                const on = value.includes(t);
                return (
                  <label key={t} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-[13px]", on ? "border-primary bg-primary-soft" : "border-border")}>
                    <input type="checkbox" checked={on} onChange={() => field.onChange(on ? value.filter((v) => v !== t) : [...value, t])} className="size-4 accent-[var(--color-primary)]" />
                    {SESSION_TYPE_LABELS[t]}
                  </label>
                );
              })}
            </div>
          );
        }} />
      </Field>
      <Button type="submit" className="w-full" loading={pending}>Publier</Button>
    </form>
  );
}
