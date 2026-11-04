"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/misc";
import { sendMentorRequestAction } from "@/lib/actions/requests";
import { mentorRequestSchema } from "@/lib/validation/schemas";
import { useServerForm } from "./use-server-form";

type Values = z.input<typeof mentorRequestSchema>;

export function MentorRequestForm({ mentorId, matchScore, defaultObjectives }: { mentorId: string; matchScore: number | null; defaultObjectives: string }) {
  const router = useRouter();
  const form = useForm<Values, unknown, z.output<typeof mentorRequestSchema>>({ resolver: zodResolver(mentorRequestSchema), defaultValues: { mentorId, motivation: "", objectives: defaultObjectives } });
  const { onSubmit, pending, error, success } = useServerForm(form, (v) => sendMentorRequestAction(v, matchScore), { onSuccess: () => router.refresh() });
  const { errors } = form.formState;
  if (success) return <Alert tone="success" title="Demande envoyée">{success}</Alert>;
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="Votre motivation" htmlFor="motivation" error={errors.motivation?.message} hint="Pourquoi ce mentor ? Qu'attendez-vous de cet accompagnement ?" required>
        <Textarea id="motivation" {...form.register("motivation")} aria-invalid={!!errors.motivation} className="min-h-28" />
      </Field>
      <Field label="Vos objectifs" htmlFor="objectives" error={errors.objectives?.message} required>
        <Textarea id="objectives" {...form.register("objectives")} aria-invalid={!!errors.objectives} />
      </Field>
      <Button type="submit" className="w-full" loading={pending}>Envoyer la demande</Button>
    </form>
  );
}
