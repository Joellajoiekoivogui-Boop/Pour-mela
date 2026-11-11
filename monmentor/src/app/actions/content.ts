"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { isDomain } from "@/lib/domains";
import { notify } from "@/lib/notify";
import { mentorLevel } from "@/lib/guards";

const RTYPES = ["guide", "checklist", "modele", "livre", "video"] as const;
const OTYPES = ["stage", "emploi", "bourse", "concours", "incubation", "evenement"] as const;
const str = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);

async function requireContributor() {
  const user = await requireUser(["MENTOR", "ADMIN"]);
  if (user.role === "MENTOR" && (await mentorLevel(user.id)) < 2) redirect("/contribuer?erreur=verification");
  return user;
}

export async function createResource(formData: FormData) {
  const user = await requireContributor();
  const type = str(formData, "type", 20) as (typeof RTYPES)[number];
  const domain = str(formData, "domain", 30);
  const title = str(formData, "title", 140);
  const summary = str(formData, "summary", 300);
  const body = str(formData, "body", 8000);
  if (!RTYPES.includes(type) || !isDomain(domain) || !title || !summary || body.length < 40) redirect("/contribuer?erreur=ressource");
  const id = newId();
  await db.insert(schema.resources).values({ id, authorId: user.id, type, domain, title, summary, body, minutes: Math.max(1, Math.min(120, Number(formData.get("minutes")) || Math.ceil(body.split(/\s+/).length / 200))), createdAt: Date.now() });
  revalidatePath("/ressources");
  redirect(`/ressources/${id}`);
}

export async function createOpportunity(formData: FormData) {
  const user = await requireContributor();
  const type = str(formData, "type", 20) as (typeof OTYPES)[number];
  const domain = str(formData, "domain", 30);
  const deadline = str(formData, "deadline", 10);
  const url = str(formData, "url", 300);
  const v = { title: str(formData, "title", 140), organization: str(formData, "organization", 120), location: str(formData, "location", 80), description: str(formData, "description", 1500) };
  if (!OTYPES.includes(type) || !isDomain(domain) || !/^\d{4}-\d{2}-\d{2}$/.test(deadline) || !v.title || !v.organization || !v.description) redirect("/contribuer?erreur=opportunite#opportunite");
  if (url && !/^https:\/\//.test(url)) redirect("/contribuer?erreur=lien#opportunite");
  await db.insert(schema.opportunities).values({ id: newId(), authorId: user.id, type, domain, deadline, url: url || null, ...v, location: v.location || "Conakry", createdAt: Date.now() });
  // Alerte des mentorés intéressés par ce domaine (spécification « alertes d'opportunités »).
  const interested = await db.select({ id: schema.menteeProfiles.userId }).from(schema.menteeProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.menteeProfiles.userId))
    .where(and(sql`exists (select 1 from json_each(${schema.menteeProfiles.domains}) where value = ${domain})`, eq(schema.users.isDemo, user.isDemo)))
    .limit(500);
  for (const m of interested) await notify(m.id, "opportunity", `Nouvelle opportunité pour vous : ${v.title} (${v.organization}), jusqu'au ${deadline}.`, { link: "/opportunites" });
  revalidatePath("/opportunites");
  redirect("/opportunites?ok=publiee");
}

export async function toggleInterest(formData: FormData) {
  const user = await requireUser();
  const opportunityId = String(formData.get("opportunityId"));
  const where = and(eq(schema.opportunityInterests.userId, user.id), eq(schema.opportunityInterests.opportunityId, opportunityId));
  const [existing] = await db.select().from(schema.opportunityInterests).where(where).limit(1);
  if (existing) await db.delete(schema.opportunityInterests).where(where);
  else await db.insert(schema.opportunityInterests).values({ userId: user.id, opportunityId, createdAt: Date.now() });
  revalidatePath("/opportunites");
}

export async function setContentHidden(formData: FormData) {
  const user = await requireUser(["ADMIN"]);
  const kind = String(formData.get("kind"));
  const ids = [String(formData.get("id"))];
  const hidden = formData.get("hidden") === "1";
  if (kind === "resource") await db.update(schema.resources).set({ hidden }).where(inArray(schema.resources.id, ids));
  if (kind === "opportunity") await db.update(schema.opportunities).set({ hidden }).where(inArray(schema.opportunities.id, ids));
  void user;
  revalidatePath("/admin/signalements");
}
