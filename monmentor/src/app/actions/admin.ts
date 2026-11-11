"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { certificateCode, newId } from "@/lib/ids";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";

export async function reviewVerification(formData: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const id = String(formData.get("id"));
  const approve = formData.get("decision") === "approve";
  const note = String(formData.get("note") ?? "").trim().slice(0, 300) || null;
  const [v] = await db.select().from(schema.verifications).where(eq(schema.verifications.id, id)).limit(1);
  if (!v || v.status !== "PENDING") return;
  await db.update(schema.verifications).set({ status: approve ? "APPROVED" : "REJECTED", reviewerId: admin.id, note, reviewedAt: Date.now(),
    // Les justificatifs ne sont plus nécessaires une fois la décision prise.
    evidence: null }).where(eq(schema.verifications.id, id));
  if (approve) await db.update(schema.mentorProfiles).set({ verificationLevel: v.level }).where(eq(schema.mentorProfiles.userId, v.userId));
  await audit(admin.id, `verification.${approve ? "approve" : "reject"}`, `${v.userId}:niveau ${v.level}`);
  await notify(v.userId, "verification", approve ? `Votre vérification de niveau ${v.level} est validée.${v.level >= 2 ? " Votre profil est maintenant visible des jeunes." : ""}` : `Votre demande de vérification n'a pas été validée.${note ? ` Motif : ${note}` : ""}`, { link: "/profil#verification" });
  revalidatePath("/admin/mentors");
}

export async function setLevel(formData: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const userId = String(formData.get("userId"));
  const level = Math.max(0, Math.min(3, Number(formData.get("level"))));
  await db.update(schema.mentorProfiles).set({ verificationLevel: level }).where(eq(schema.mentorProfiles.userId, userId));
  await audit(admin.id, "verification.set", `${userId}:niveau ${level}`);
  revalidatePath("/admin/mentors");
}

export async function handleReport(formData: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const id = String(formData.get("id"));
  const action = String(formData.get("action"));
  const [r] = await db.select().from(schema.reports).where(eq(schema.reports.id, id)).limit(1);
  if (!r) return;
  const now = Date.now();
  if (action === "remove") {
    if (r.targetType === "RESOURCE") await db.update(schema.resources).set({ hidden: true }).where(eq(schema.resources.id, r.targetId));
    if (r.targetType === "OPPORTUNITY") await db.update(schema.opportunities).set({ hidden: true }).where(eq(schema.opportunities.id, r.targetId));
    if (r.targetType === "MESSAGE") await db.update(schema.messages).set({ body: "Message retiré par la coordination." }).where(eq(schema.messages.id, r.targetId));
  }
  if ((action === "suspend" || action === "ban") && r.targetUserId) {
    await db.update(schema.users).set({ suspendedAt: now }).where(eq(schema.users.id, r.targetUserId));
    await db.delete(schema.authSessions).where(eq(schema.authSessions.userId, r.targetUserId));
  }
  if (action === "warn" && r.targetUserId) {
    await notify(r.targetUserId, "warning", "La coordination de MonMentor vous adresse un avertissement suite à un signalement. Relisez la charte de conduite.", { link: "/charte" });
  }
  if (action === "restore" && r.targetUserId) await db.update(schema.users).set({ suspendedAt: null }).where(eq(schema.users.id, r.targetUserId));
  const status = action === "dismiss" || action === "restore" ? "DISMISSED" : action === "review" ? "IN_REVIEW" : "ACTIONED";
  // Une décision vaut pour tous les signalements ouverts sur la même cible.
  await db.update(schema.reports).set({ status, action, reviewedBy: admin.id, reviewedAt: now })
    .where(and(or(eq(schema.reports.id, id), eq(schema.reports.targetId, r.targetId)), or(eq(schema.reports.status, "OPEN"), eq(schema.reports.status, "IN_REVIEW"))));
  await audit(admin.id, `report.${action}`, `${r.targetType}:${r.targetId}`);
  revalidatePath("/admin/signalements");
}

export async function issueCertificate(formData: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const who = String(formData.get("who") ?? "").trim().toLowerCase();
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const [u] = await db.select().from(schema.users).where(or(eq(schema.users.email, who), eq(schema.users.phone, who), eq(schema.users.id, who))).limit(1);
  if (!u || !title) redirect("/admin/certificats?erreur=1");
  const code = certificateCode();
  await db.insert(schema.certificates).values({ id: newId(), code, userId: u.id, title, issuedBy: admin.id, issuedAt: Date.now() });
  await audit(admin.id, "certificate.issue", code);
  await notify(u.id, "certificate", `Vous obtenez le certificat « ${title} ». Ajoutez-le à votre profil LinkedIn depuis votre CV.`, { link: "/profil/cv" });
  redirect(`/admin/certificats?ok=${code}`);
}

export async function revokeCertificate(formData: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const code = String(formData.get("code"));
  await db.update(schema.certificates).set({ revokedAt: Date.now() }).where(eq(schema.certificates.code, code));
  await audit(admin.id, "certificate.revoke", code);
  revalidatePath("/admin/certificats");
}
