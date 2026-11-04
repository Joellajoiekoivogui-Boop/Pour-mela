"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import type { ActionResult } from "@/lib/actions/result";

/**
 * Bouton qui exécute une action serveur, affiche le résultat (toast) puis
 * rafraîchit la page. Option `confirm` : demande une confirmation. Option
 * `prompt` : demande un texte (motif, lien…) avant d'exécuter l'action.
 */
export function ActionButton({
  action, children, confirm, prompt, onDone, ...props
}: Omit<ButtonProps, "onClick" | "action"> & {
  action: (text: string) => Promise<ActionResult<unknown>>;
  confirm?: string;
  prompt?: { label: string; placeholder?: string; required?: boolean; submitLabel?: string };
  onDone?: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [asking, setAsking] = useState(false);
  const [text, setText] = useState("");

  const run = (value: string) =>
    start(async () => {
      const r = await action(value);
      if (r.ok) {
        if (r.message) toast.success(r.message);
        setAsking(false);
        setText("");
        onDone?.();
        router.refresh();
      } else toast.error(r.error);
    });

  if (asking && prompt) {
    return (
      <div className="w-full space-y-2 rounded-lg border border-border bg-subtle/50 p-3">
        <label className="text-sm font-medium" htmlFor="action-prompt">{prompt.label}</label>
        <Textarea id="action-prompt" value={text} onChange={(e) => setText(e.target.value)} placeholder={prompt.placeholder} className="min-h-16 bg-white" maxLength={1000} autoFocus />
        <div className="flex justify-end gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => setAsking(false)}>Annuler</Button>
          <Button type="button" size="sm" variant={props.variant} loading={pending} disabled={prompt.required && !text.trim()} onClick={() => run(text)}>
            {prompt.submitLabel ?? "Valider"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      type="button"
      loading={pending}
      onClick={() => {
        if (prompt) return setAsking(true);
        if (confirm && !window.confirm(confirm)) return;
        run("");
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
