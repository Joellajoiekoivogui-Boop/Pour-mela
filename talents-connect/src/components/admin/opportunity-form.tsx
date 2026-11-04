"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/misc";
import { useServerForm } from "@/components/forms/use-server-form";
import { saveOpportunityAction } from "@/lib/actions/content";
import { OPPORTUNITY_CATEGORY_LABELS } from "@/lib/labels";
import { opportunitySchema } from "@/lib/validation/schemas";
import type { Domain, Opportunity } from "@/types/db";

type Values = z.input<typeof opportunitySchema>;

export function OpportunityForm({ domains, opportunity }: { domains: Domain[]; opportunity?: Opportunity }) {
  const router = useRouter();
  const o = opportunity;
  const form = useForm<Values, unknown, z.output<typeof opportunitySchema>>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      title: o?.title ?? "", organization: o?.organization ?? "", description: o?.description ?? "", category: o?.category ?? "internship",
      domainId: o?.domain_id ? String(o.domain_id) : "", location: o?.location ?? "", deadline: o?.deadline ?? "", requirements: o?.requirements ?? "",
      applyUrl: o?.apply_url ?? "", imageUrl: o?.image_url ?? "", isPublished: o?.is_published ?? true,
    },
  });
  const { onSubmit, pending, error } = useServerForm(form, (v) => saveOpportunityAction(v, o?.id), {
    onSuccess: () => { if (o) router.push("/admin/opportunites"); else { form.reset(); router.refresh(); } },
  });
  const { errors } = form.formState;
  const r = form.register;
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert tone="danger">{error}</Alert>}
      <Alert tone="info">Publiez uniquement des opportunités vérifiées, avec le lien officiel de candidature.</Alert>
      <Field label="Titre" htmlFor="op-title" error={errors.title?.message} required><Input id="op-title" {...r("title")} /></Field>
      <Field label="Organisation" htmlFor="op-org" error={errors.organization?.message} required><Input id="op-org" {...r("organization")} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Catégorie" htmlFor="op-cat"><Select id="op-cat" {...r("category")}>{Object.entries(OPPORTUNITY_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
        <Field label="Domaine" htmlFor="op-domain" hint="Les mentorés intéressés seront notifiés"><Select id="op-domain" {...r("domainId")}><option value="">Tous les domaines</option>{domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
        <Field label="Localisation" htmlFor="op-loc"><Input id="op-loc" placeholder="Conakry ou En ligne" {...r("location")} /></Field>
        <Field label="Date limite" htmlFor="op-deadline"><Input id="op-deadline" type="date" {...r("deadline")} /></Field>
      </div>
      <Field label="Description" htmlFor="op-desc" error={errors.description?.message} required><Textarea id="op-desc" className="min-h-28" {...r("description")} /></Field>
      <Field label="Conditions" htmlFor="op-req"><Textarea id="op-req" className="min-h-16" {...r("requirements")} /></Field>
      <Field label="Lien de candidature" htmlFor="op-url" error={errors.applyUrl?.message}><Input id="op-url" type="url" placeholder="https://" {...r("applyUrl")} /></Field>
      <Field label="Image (adresse, facultatif)" htmlFor="op-img" error={errors.imageUrl?.message}><Input id="op-img" type="url" placeholder="https://" {...r("imageUrl")} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[var(--color-primary)]" {...r("isPublished")} /> Publier immédiatement</label>
      <Button type="submit" loading={pending} className="w-full">{o ? "Enregistrer les modifications" : "Publier l'opportunité"}</Button>
    </form>
  );
}
