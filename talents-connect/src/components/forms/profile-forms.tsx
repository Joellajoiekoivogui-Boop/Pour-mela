"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/misc";
import { saveMenteeProfileAction, saveMentorProfileAction } from "@/lib/actions/profile";
import { EDUCATION_LEVELS, SESSION_TYPE_LABELS, SESSION_TYPES } from "@/lib/labels";
import { menteeProfileSchema, mentorProfileSchema } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";
import type { Domain, Skill } from "@/types/db";
import { TagPicker } from "./tag-picker";
import { useServerForm } from "./use-server-form";

type MenteeValues = z.input<typeof menteeProfileSchema>;
type MentorValues = z.input<typeof mentorProfileSchema>;

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle>{description && <CardDescription>{description}</CardDescription>}</CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

const skillOptions = (skills: Skill[], domains: Domain[]) => {
  const dn = new Map(domains.map((d) => [d.id, d.name]));
  return skills.map((s) => ({ id: s.id, label: s.name, group: s.domain_id ? dn.get(s.domain_id) : undefined }));
};

export function MenteeProfileForm({ defaults, domains, skills }: { defaults: MenteeValues; domains: Domain[]; skills: Skill[] }) {
  const form = useForm<MenteeValues, unknown, z.output<typeof menteeProfileSchema>>({ resolver: zodResolver(menteeProfileSchema), defaultValues: defaults });
  const { onSubmit, pending, error } = useServerForm(form, saveMenteeProfileAction);
  const { errors } = form.formState;
  const r = form.register;
  const opts = skillOptions(skills, domains);

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {error && <Alert tone="danger">{error}</Alert>}
      <Section title="Identité">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" htmlFor="firstName" error={errors.firstName?.message} required><Input id="firstName" {...r("firstName")} aria-invalid={!!errors.firstName} /></Field>
          <Field label="Nom" htmlFor="lastName" error={errors.lastName?.message} required><Input id="lastName" {...r("lastName")} aria-invalid={!!errors.lastName} /></Field>
          <Field label="Localisation" htmlFor="location" hint="Ville, pays" error={errors.location?.message}><Input id="location" placeholder="Conakry, Guinée" {...r("location")} /></Field>
          <Field label="Date de naissance" htmlFor="birthDate" hint="Facultatif" error={errors.birthDate?.message}><Input id="birthDate" type="date" {...r("birthDate")} /></Field>
        </div>
        <Field label="Présentation" htmlFor="bio" error={errors.bio?.message} hint="Quelques lignes sur vous, votre parcours et ce qui vous motive."><Textarea id="bio" {...r("bio")} /></Field>
      </Section>

      <Section title="Formation">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Niveau d'études" htmlFor="educationLevel" error={errors.educationLevel?.message}>
            <Select id="educationLevel" {...r("educationLevel")}>
              <option value="">— Choisir —</option>
              {Object.entries(EDUCATION_LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Établissement" htmlFor="institution" error={errors.institution?.message}><Input id="institution" placeholder="Université Gamal Abdel Nasser" {...r("institution")} /></Field>
          <Field label="Formation / filière" htmlFor="fieldOfStudy" className="sm:col-span-2" error={errors.fieldOfStudy?.message}><Input id="fieldOfStudy" placeholder="Licence en informatique" {...r("fieldOfStudy")} /></Field>
        </div>
      </Section>

      <Section title="Ce que vous recherchez" description="Ces informations alimentent directement le moteur de matching.">
        <Field label="Domaines recherchés" htmlFor="domainIds" error={errors.domainIds?.message}>
          <Controller control={form.control} name="domainIds" render={({ field }) => (
            <TagPicker label="Domaines recherchés" options={domains.map((d) => ({ id: d.id, label: d.name }))} value={field.value as number[]} onChange={field.onChange} max={5} />
          )} />
        </Field>
        <Field label="Compétences que vous voulez acquérir" htmlFor="skillIds" error={errors.skillIds?.message}>
          <Controller control={form.control} name="skillIds" render={({ field }) => (
            <TagPicker label="Compétences recherchées" options={opts} value={field.value as number[]} onChange={field.onChange} searchable max={12} />
          )} />
        </Field>
        <Field label="Objectifs professionnels" htmlFor="professionalGoals" error={errors.professionalGoals?.message} hint="Ex. : devenir développeur full stack, créer mon entreprise agricole…">
          <Textarea id="professionalGoals" {...r("professionalGoals")} />
        </Field>
        <Field label="Besoins de votre projet" htmlFor="projectNeeds" error={errors.projectNeeds?.message} hint="Facultatif : un projet en cours pour lequel vous cherchez des conseils ?">
          <Textarea id="projectNeeds" {...r("projectNeeds")} />
        </Field>
      </Section>

      <Section title="Vos acquis">
        <Field label="Compétences actuelles" htmlFor="hasSkillIds">
          <Controller control={form.control} name="hasSkillIds" render={({ field }) => (
            <TagPicker label="Compétences actuelles" options={opts} value={field.value as number[]} onChange={field.onChange} searchable max={20} />
          )} />
        </Field>
        <Field label="Centres d'intérêt" htmlFor="interests" error={errors.interests?.message}><Textarea id="interests" className="min-h-16" placeholder="Lecture, robotique, entrepreneuriat social…" {...r("interests")} /></Field>
      </Section>

      <div className="sticky bottom-4 flex justify-end">
        <Button type="submit" size="lg" loading={pending} className="shadow-lg">Enregistrer mon profil</Button>
      </div>
    </form>
  );
}

export function MentorProfileForm({ defaults, domains, skills }: { defaults: MentorValues; domains: Domain[]; skills: Skill[] }) {
  const form = useForm<MentorValues, unknown, z.output<typeof mentorProfileSchema>>({ resolver: zodResolver(mentorProfileSchema), defaultValues: defaults });
  const { onSubmit, pending, error } = useServerForm(form, saveMentorProfileAction);
  const { errors } = form.formState;
  const r = form.register;

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {error && <Alert tone="danger">{error}</Alert>}
      <Section title="Identité">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" htmlFor="firstName" error={errors.firstName?.message} required><Input id="firstName" {...r("firstName")} aria-invalid={!!errors.firstName} /></Field>
          <Field label="Nom" htmlFor="lastName" error={errors.lastName?.message} required><Input id="lastName" {...r("lastName")} aria-invalid={!!errors.lastName} /></Field>
          <Field label="Localisation" htmlFor="location" error={errors.location?.message}><Input id="location" placeholder="Conakry, Guinée" {...r("location")} /></Field>
        </div>
        <Field label="Présentation personnelle" htmlFor="bio" error={errors.bio?.message} hint="Ce que vous aimez transmettre, votre façon d'accompagner."><Textarea id="bio" {...r("bio")} /></Field>
      </Section>

      <Section title="Parcours professionnel">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Poste actuel" htmlFor="jobTitle" error={errors.jobTitle?.message} required><Input id="jobTitle" placeholder="Ingénieure logiciel" {...r("jobTitle")} aria-invalid={!!errors.jobTitle} /></Field>
          <Field label="Entreprise ou organisation" htmlFor="organization" error={errors.organization?.message}><Input id="organization" {...r("organization")} /></Field>
          <Field label="Années d'expérience" htmlFor="yearsExperience" error={errors.yearsExperience?.message}><Input id="yearsExperience" type="number" min={0} max={60} {...r("yearsExperience")} /></Field>
        </div>
        <Field label="Expériences professionnelles" htmlFor="experiences" error={errors.experiences?.message} hint="Postes marquants, réalisations, secteurs."><Textarea id="experiences" className="min-h-32" {...r("experiences")} /></Field>
        <Field label="Parcours académique" htmlFor="education" error={errors.education?.message}><Textarea id="education" {...r("education")} /></Field>
      </Section>

      <Section title="Expertise" description="Utilisée par le moteur de matching pour vous recommander aux mentorés.">
        <Field label="Domaines d'expertise" htmlFor="domainIds">
          <Controller control={form.control} name="domainIds" render={({ field }) => (
            <TagPicker label="Domaines d'expertise" options={domains.map((d) => ({ id: d.id, label: d.name }))} value={field.value as number[]} onChange={field.onChange} max={5} />
          )} />
        </Field>
        <Field label="Compétences que vous transmettez" htmlFor="skillIds">
          <Controller control={form.control} name="skillIds" render={({ field }) => (
            <TagPicker label="Compétences transmises" options={skillOptions(skills, domains)} value={field.value as number[]} onChange={field.onChange} searchable max={20} />
          )} />
        </Field>
      </Section>

      <Section title="Accompagnement">
        <Field label="Types d'accompagnement proposés" htmlFor="supportTypes" error={errors.supportTypes?.message}>
          <Controller control={form.control} name="supportTypes" render={({ field }) => {
            const value = (field.value ?? []) as string[];
            return (
              <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Types d'accompagnement">
                {SESSION_TYPES.map((t) => {
                  const on = value.includes(t);
                  return (
                    <label key={t} className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm", on ? "border-primary bg-primary-soft" : "border-border")}>
                      <input type="checkbox" checked={on} onChange={() => field.onChange(on ? value.filter((v) => v !== t) : [...value, t])} className="size-4 accent-[var(--color-primary)]" />
                      {SESSION_TYPE_LABELS[t]}
                    </label>
                  );
                })}
              </div>
            );
          }} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Langues parlées" htmlFor="languages" error={errors.languages?.message} hint="Séparées par des virgules">
            <Controller control={form.control} name="languages" render={({ field }) => (
              <Input id="languages" defaultValue={(field.value ?? []).join(", ")} onBlur={(e) => field.onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} placeholder="Français, Soussou, Anglais" />
            )} />
          </Field>
          <Field label="Nombre maximal de mentorés" htmlFor="maxMentees" error={errors.maxMentees?.message}><Input id="maxMentees" type="number" min={1} max={50} {...r("maxMentees")} /></Field>
        </div>
        <Field label="Disponibilités indicatives" htmlFor="availabilityNote" error={errors.availabilityNote?.message} hint="Ex. : le samedi matin, deux soirs par mois. Publiez vos créneaux précis dans le calendrier.">
          <Input id="availabilityNote" {...r("availabilityNote")} />
        </Field>
      </Section>

      <div className="sticky bottom-4 flex justify-end">
        <Button type="submit" size="lg" loading={pending} className="shadow-lg">Enregistrer mon profil</Button>
      </div>
    </form>
  );
}
