"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { changePasswordAction, deleteAccountAction } from "@/lib/actions/community";

export function SettingsForms({ email, canDelete }: { email: string; canDelete: boolean }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [deleteText, setDeleteText] = useState("");
  const [pending, start] = useTransition();
  const mismatch = confirm.length > 0 && confirm !== password;

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader><CardTitle>Compte</CardTitle><CardDescription>Adresse de connexion : <strong className="text-foreground">{email}</strong></CardDescription></CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); start(async () => {
            const r = await changePasswordAction({ password });
            if (r.ok) { toast.success(r.message); setPassword(""); setConfirm(""); } else toast.error(r.fieldErrors?.password ?? r.error);
          }); }}>
            <Field label="Nouveau mot de passe" htmlFor="new-password" hint="8 caractères minimum, avec au moins une lettre et un chiffre.">
              <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <Field label="Confirmer" htmlFor="confirm-password" error={mismatch ? "Les mots de passe ne correspondent pas" : undefined}>
              <Input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
            <Button type="submit" loading={pending} disabled={!password || mismatch}>Changer le mot de passe</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Fuseau horaire</CardTitle><CardDescription>Les horaires sont affichés à l&apos;heure de Conakry (Africa/Conakry, GMT, sans heure d&apos;été).</CardDescription></CardHeader>
      </Card>
      {canDelete && (
        <Card className="border-red-200">
          <CardHeader><CardTitle className="text-danger">Supprimer mon compte</CardTitle><CardDescription>Action définitive : profil, demandes, mentorats, messages et objectifs seront effacés.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Saisissez SUPPRIMER pour confirmer" htmlFor="delete-confirm"><Input id="delete-confirm" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} /></Field>
            <Button variant="danger" loading={pending} disabled={deleteText !== "SUPPRIMER"} onClick={() => start(async () => {
              const r = await deleteAccountAction(deleteText);
              if (r && !r.ok) toast.error(r.error);
            })}>Supprimer définitivement</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
