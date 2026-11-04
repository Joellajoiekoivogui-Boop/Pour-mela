"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/misc";
import { createResourceAction } from "@/lib/actions/content";
import { RESOURCE_TYPE_LABELS } from "@/lib/labels";
import type { Domain, ResourceType } from "@/types/db";

export function ResourceForm({ domains }: { domains: Domain[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<ResourceType>("link");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const isFile = type === "pdf" || type === "image";

  return (
    <form ref={formRef} className="space-y-4" noValidate onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      start(async () => {
        const r = await createResourceAction(fd);
        if (r.ok) { toast.success(r.message); formRef.current?.reset(); setType("link"); setErrors({}); setError(null); router.refresh(); }
        else { setError(r.error); setErrors(r.fieldErrors ?? {}); }
      });
    }}>
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="Titre" htmlFor="res-title" error={errors.title} required><Input id="res-title" name="title" maxLength={200} required /></Field>
      <Field label="Description" htmlFor="res-desc" error={errors.description}><Textarea id="res-desc" name="description" maxLength={2000} className="min-h-16" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Catégorie" htmlFor="res-domain" error={errors.domainId} required>
          <Select id="res-domain" name="domainId" defaultValue="">
            <option value="" disabled>— Choisir —</option>
            {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Field>
        <Field label="Format" htmlFor="res-type">
          <Select id="res-type" name="type" value={type} onChange={(e) => setType(e.target.value as ResourceType)}>
            {Object.entries(RESOURCE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
      </div>
      {isFile ? (
        <Field label={type === "pdf" ? "Fichier PDF" : "Image"} htmlFor="res-file" error={errors.file} hint="10 Mo maximum">
          <Input id="res-file" name="file" type="file" accept={type === "pdf" ? "application/pdf" : "image/jpeg,image/png,image/webp"} className="py-2" />
        </Field>
      ) : (
        <Field label={type === "video" ? "Lien YouTube ou Vimeo" : "Adresse du lien"} htmlFor="res-url" error={errors.url}>
          <Input id="res-url" name="url" type="url" placeholder="https://" />
        </Field>
      )}
      <Button type="submit" loading={pending}>Publier la ressource</Button>
    </form>
  );
}
