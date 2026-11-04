"use client";

import { useState, useTransition } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/actions/result";

/**
 * Relie un formulaire React Hook Form à une action serveur : affiche les
 * erreurs par champ renvoyées par le serveur, l'erreur générale, et un toast
 * de succès.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- le type transformé du résolveur n'est pas utilisé ici
export function useServerForm<T extends FieldValues, R>(form: UseFormReturn<T, any, any>, action: (values: T) => Promise<ActionResult<R>>, opts: { successToast?: boolean; onSuccess?: (r: ActionResult<R> & { ok: true }) => void } = {}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Les valeurs BRUTES (non transformées) sont envoyées au serveur, qui les
  // revalide avec le même schéma Zod.
  const onSubmit = form.handleSubmit(() => {
    const values = form.getValues();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await action(values);
      if (!result) return; // redirection effectuée par le serveur
      if (result.ok) {
        if (result.message) setSuccess(result.message);
        if (result.message && opts.successToast !== false) toast.success(result.message);
        opts.onSuccess?.(result);
      } else {
        setError(result.error);
        for (const [key, message] of Object.entries(result.fieldErrors ?? {})) form.setError(key as Path<T>, { message });
      }
    });
  });

  return { onSubmit, pending, error, success, setSuccess };
}
