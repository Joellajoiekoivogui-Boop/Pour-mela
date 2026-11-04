"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/misc";
import { createGoalAction } from "@/lib/actions/goals";
import { GOAL_PRIORITY_LABELS } from "@/lib/labels";
import { useServerForm } from "@/components/forms/use-server-form";

// Le formulaire manipule des objets { title } pour useFieldArray ; converti avant l'envoi.
const formSchema = z.object({
  title: z.string().trim().min(3, "Titre requis").max(160),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
  mentorshipId: z.string().optional(),
  milestones: z.array(z.object({ title: z.string().trim().max(200) })).max(30),
});
type Values = z.infer<typeof formSchema>;

/**
 * Création d'un objectif avec ses étapes. `initial` permet de pré-remplir le
 * formulaire (par exemple avec un plan généré par l'assistant).
 */
export function GoalForm({ mentorships, menteeId, initial, onCreated }: {
  mentorships: { id: string; label: string }[];
  menteeId?: string;
  initial?: { title: string; description?: string; milestones: string[] };
  onCreated?: (id: string) => void;
}) {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initial?.title ?? "", description: initial?.description ?? "", priority: "medium", dueDate: "",
      mentorshipId: mentorships.length === 1 && menteeId ? mentorships[0]!.id : "",
      milestones: (initial?.milestones.length ? initial.milestones : ["", "", ""]).map((title) => ({ title })),
    },
  });
  const steps = useFieldArray({ control: form.control, name: "milestones" });
  const { onSubmit, pending, error } = useServerForm(form, (v) => createGoalAction({
    ...v, menteeId, milestones: v.milestones.map((m) => m.title.trim()).filter((t) => t.length >= 2),
  }), {
    onSuccess: (r) => {
      form.reset();
      const id = (r.data as { id: string } | undefined)?.id;
      if (id && onCreated) onCreated(id);
      else router.refresh();
    },
  });
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="Objectif" htmlFor="goal-title" error={errors.title?.message} required>
        <Input id="goal-title" placeholder="Ex. : Devenir développeur Full Stack" {...form.register("title")} aria-invalid={!!errors.title} />
      </Field>
      <Field label="Description" htmlFor="goal-description"><Textarea id="goal-description" className="min-h-16" {...form.register("description")} /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Priorité" htmlFor="goal-priority">
          <Select id="goal-priority" {...form.register("priority")}>{Object.entries(GOAL_PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
        </Field>
        <Field label="Date limite" htmlFor="goal-due"><Input id="goal-due" type="date" {...form.register("dueDate")} /></Field>
        <Field label="Mentorat associé" htmlFor="goal-mentorship" hint={menteeId ? undefined : "Votre mentor pourra le suivre"}>
          <Select id="goal-mentorship" {...form.register("mentorshipId")}>
            {!menteeId && <option value="">Aucun (objectif personnel)</option>}
            {mentorships.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </Select>
        </Field>
      </div>
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium">Étapes à accomplir</legend>
        {steps.fields.map((f, i) => (
          <div key={f.id} className="flex gap-2">
            <span className="mt-2.5 w-5 shrink-0 text-right text-xs text-muted">{i + 1}.</span>
            <Input {...form.register(`milestones.${i}.title`)} placeholder={i === 0 ? "Ex. : Apprendre HTML et CSS" : "Étape suivante"} aria-label={`Étape ${i + 1}`} />
            <Button type="button" variant="ghost" size="icon" onClick={() => steps.remove(i)} aria-label={`Supprimer l'étape ${i + 1}`}><Trash2 /></Button>
          </div>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={() => steps.append({ title: "" })} disabled={steps.fields.length >= 30}><Plus /> Ajouter une étape</Button>
      </fieldset>
      <Button type="submit" loading={pending} className="w-full sm:w-auto">Créer l&apos;objectif</Button>
    </form>
  );
}
