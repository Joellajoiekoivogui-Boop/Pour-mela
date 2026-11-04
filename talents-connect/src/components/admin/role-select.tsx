"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select } from "@/components/ui/input";
import { setRoleAction } from "@/lib/actions/admin";
import { ROLE_LABELS } from "@/lib/labels";
import type { UserRole } from "@/types/db";

/** Changement de rôle (super administrateur uniquement, revérifié en base). */
export function RoleSelect({ userId, role, disabled }: { userId: string; role: UserRole; disabled?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Select
      value={role} disabled={disabled || pending} aria-label="Rôle" className="h-8 w-44 text-xs"
      onChange={(e) => {
        const next = e.target.value as UserRole;
        if (!window.confirm(`Attribuer le rôle « ${ROLE_LABELS[next]} » ?`)) { e.target.value = role; return; }
        start(async () => { const r = await setRoleAction(userId, next); if (r.ok) { toast.success(r.message); router.refresh(); } else toast.error(r.error); });
      }}
    >
      {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
    </Select>
  );
}
