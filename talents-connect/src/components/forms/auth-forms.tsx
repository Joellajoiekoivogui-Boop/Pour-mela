"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { GraduationCap, MailCheck, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/misc";
import {
  requestPasswordResetAction, resendConfirmationAction, signInAction, signUpAction, updatePasswordAction,
} from "@/lib/actions/auth";
import { emailSchema, resetPasswordSchema, signInSchema, signUpSchema } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";
import { useServerForm } from "./use-server-form";

export function SignInForm({ next }: { next?: string }) {
  const form = useForm<z.input<typeof signInSchema>>({ resolver: zodResolver(signInSchema), defaultValues: { email: "", password: "", next } });
  const { onSubmit, pending, error } = useServerForm(form, signInAction);
  const { errors } = form.formState;
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="Adresse e-mail" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register("email")} />
      </Field>
      <Field label="Mot de passe" htmlFor="password" error={errors.password?.message}>
        <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...form.register("password")} />
      </Field>
      <div className="flex justify-end"><Link href="/mot-de-passe-oublie" className="text-sm text-primary hover:underline">Mot de passe oublié ?</Link></div>
      <Button type="submit" className="w-full" loading={pending}>Se connecter</Button>
    </form>
  );
}

const ROLE_CHOICES = [
  { value: "mentee", title: "Je souhaite être accompagné", text: "Trouver un mentor, suivre mes objectifs", icon: GraduationCap },
  { value: "mentor", title: "Je souhaite devenir mentor", text: "Transmettre mon expérience", icon: Presentation },
] as const;

export function SignUpForm({ defaultRole }: { defaultRole?: "mentee" | "mentor" }) {
  const form = useForm<z.input<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { role: defaultRole, firstName: "", lastName: "", email: "", password: "", acceptTerms: false as unknown as true },
  });
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { onSubmit, pending, error } = useServerForm(form, signUpAction, { successToast: false, onSuccess: () => setSentTo(form.getValues("email")) });
  const { errors } = form.formState;
  const role = useWatch({ control: form.control, name: "role" });

  if (sentTo) return <CheckEmail email={sentTo} />;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error && <Alert tone="danger">{error}</Alert>}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Votre profil <span className="text-danger" aria-hidden>*</span></legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLE_CHOICES.map((c) => (
            <label key={c.value} className={cn("flex cursor-pointer gap-3 rounded-lg border p-3.5 transition-colors", role === c.value ? "border-primary bg-primary-soft ring-1 ring-primary" : "border-border hover:bg-subtle")}>
              <input type="radio" value={c.value} className="sr-only" {...form.register("role")} />
              <c.icon className={cn("mt-0.5 size-5 shrink-0", role === c.value ? "text-primary" : "text-slate-400")} aria-hidden />
              <span><span className="block text-sm font-medium">{c.title}</span><span className="block text-xs text-muted">{c.text}</span></span>
            </label>
          ))}
        </div>
        {errors.role && <p role="alert" className="mt-1.5 text-xs font-medium text-danger">{errors.role.message}</p>}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" htmlFor="firstName" error={errors.firstName?.message} required>
          <Input id="firstName" autoComplete="given-name" aria-invalid={!!errors.firstName} {...form.register("firstName")} />
        </Field>
        <Field label="Nom" htmlFor="lastName" error={errors.lastName?.message} required>
          <Input id="lastName" autoComplete="family-name" aria-invalid={!!errors.lastName} {...form.register("lastName")} />
        </Field>
      </div>
      <Field label="Adresse e-mail" htmlFor="email" error={errors.email?.message} required>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register("email")} />
      </Field>
      <Field label="Mot de passe" htmlFor="password" error={errors.password?.message} hint="8 caractères minimum, avec au moins une lettre et un chiffre." required>
        <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register("password")} />
      </Field>
      <div>
        <label className="flex items-start gap-2.5 text-sm text-slate-700">
          <input type="checkbox" className="mt-0.5 size-4 rounded border-border accent-[var(--color-primary)]" {...form.register("acceptTerms")} />
          <span>J&apos;accepte les <Link href="/conditions" className="text-primary underline" target="_blank">conditions d&apos;utilisation</Link> et la <Link href="/confidentialite" className="text-primary underline" target="_blank">politique de confidentialité</Link>.</span>
        </label>
        {errors.acceptTerms && <p role="alert" className="mt-1.5 text-xs font-medium text-danger">{errors.acceptTerms.message}</p>}
      </div>
      <Button type="submit" className="w-full" loading={pending}>Créer mon compte</Button>
    </form>
  );
}

function CheckEmail({ email }: { email: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className="text-center">
      <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-success-soft text-success"><MailCheck className="size-6" /></span>
      <h2 className="mt-4 text-lg font-semibold text-navy">Vérifiez votre boîte mail</h2>
      <p className="mt-2 text-sm text-muted">Un lien de confirmation a été envoyé à <strong className="text-foreground">{email}</strong>. Cliquez dessus pour activer votre compte, puis complétez votre profil.</p>
      {message && <Alert tone="info" className="mt-4 text-left">{message}</Alert>}
      <Button
        variant="secondary" className="mt-6" loading={pending}
        onClick={async () => { setPending(true); const r = await resendConfirmationAction({ email }); setMessage(r.ok ? r.message ?? null : r.error); setPending(false); }}
      >
        Renvoyer l&apos;e-mail
      </Button>
    </div>
  );
}

export function ForgotPasswordForm() {
  const form = useForm<z.input<typeof emailSchema>>({ resolver: zodResolver(emailSchema), defaultValues: { email: "" } });
  const { onSubmit, pending, error, success } = useServerForm(form, requestPasswordResetAction, { successToast: false });
  const { errors } = form.formState;
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert tone="danger">{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}
      <Field label="Adresse e-mail" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register("email")} />
      </Field>
      <Button type="submit" className="w-full" loading={pending}>Envoyer le lien</Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const form = useForm<z.input<typeof resetPasswordSchema>>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: "", confirm: "" } });
  const { onSubmit, pending, error, success } = useServerForm(form, updatePasswordAction);
  const { errors } = form.formState;
  if (success) {
    return (
      <div className="space-y-4">
        <Alert tone="success">{success}</Alert>
        <Link href="/espace" className="block text-center text-sm font-medium text-primary hover:underline">Accéder à mon espace →</Link>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="Nouveau mot de passe" htmlFor="password" error={errors.password?.message} hint="8 caractères minimum, avec au moins une lettre et un chiffre.">
        <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register("password")} />
      </Field>
      <Field label="Confirmer le mot de passe" htmlFor="confirm" error={errors.confirm?.message}>
        <Input id="confirm" type="password" autoComplete="new-password" aria-invalid={!!errors.confirm} {...form.register("confirm")} />
      </Field>
      <Button type="submit" className="w-full" loading={pending}>Enregistrer</Button>
    </form>
  );
}
