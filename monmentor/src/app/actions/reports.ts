"use server";
import { and, count, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { notify } from "@/lib/notify";
import { hit } from "@/lib/rate-limit";
import type { ReportReason } from "@/db/schema";

const REASONS: ReportReason[] = ["HARASSMENT", "SCAM", "INAPPROPRIATE", "FAKE_PROFILE", "OTHER"];
const TYPES = ["USER", "MESSAGE", "SESSION", "RESOURCE", "OPPORTUNITY"] as const;

export type ReportState = { ok?: boolean; error?: string };

export async function createReport(_prev: ReportState, formData: FormData): Promise<ReportState> {
  const user = await requireUser();
  const reason = String(formData.get("reason")) as ReportReason;
  const targetType = String(formData.get("targetType")) as (typeof TYPES)[number];
  const targetId = String(formData.get("targetId") ?? "");
  const targetUserId = String(formData.get("targetUserId") ?? "") || null;
  if (!REASONS.includes(reason) || !TYPES.includes(targetType) || !targetId) return { error: "Choisissez un motif." };
  if (!(await hit(`report:${user.id}`, 10, 86_400_000))) return { error: "Trop de signalements aujourd'hui. Écrivez à la coordination." };
  await db.insert(schema.reports).values({
    id: newId(), reporterId: user.id, targetType, targetId, targetUserId, reason,
    details: String(formData.get("details") ?? "").trim().slice(0, 1000) || null, createdAt: Date.now(),
  });
  // Motifs graves : alerte immédiate de la coordination.
  if (reason === "HARASSMENT" || reason === "SCAM") {
    const admins = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.role, "ADMIN"));
    for (const a of admins) await notify(a.id, "report_urgent", `Signalement urgent (${reason === "SCAM" ? "arnaque" : "harcèlement"}) à traiter.`, { link: "/admin/signalements", urgent: true });
  }
  // Trois signalements ouverts sur une même personne : suspension en attendant la revue.
  if (targetUserId) {
    const [r] = await db.select({ n: count() }).from(schema.reports)
      .where(and(eq(schema.reports.targetUserId, targetUserId), inArray(schema.reports.status, ["OPEN", "IN_REVIEW"])));
    if (Number(r?.n ?? 0) >= 3) {
      await db.update(schema.users).set({ suspendedAt: Date.now() }).where(eq(schema.users.id, targetUserId));
    }
  }
  return { ok: true };
}
