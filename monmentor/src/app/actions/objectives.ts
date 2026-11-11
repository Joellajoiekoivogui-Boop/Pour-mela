"use server";
import { revalidatePath } from "next/cache";
import { and, eq, max } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { isDomain } from "@/lib/domains";
import { activeMentorship } from "@/lib/queries";
import { notify } from "@/lib/notify";

async function ownObjective(userId: string, id: string) {
  const [o] = await db.select().from(schema.objectives).where(and(eq(schema.objectives.id, id), eq(schema.objectives.menteeId, userId))).limit(1);
  return o ?? null;
}

export async function createObjective(formData: FormData) {
  const user = await requireUser(["MENTEE"]);
  const title = String(formData.get("title") ?? "").trim().slice(0, 140);
  const domain = String(formData.get("domain") ?? "");
  const dueDate = String(formData.get("dueDate") ?? "") || null;
  const steps = String(formData.get("steps") ?? "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 12);
  if (!title || !isDomain(domain)) return;
  const id = newId();
  await db.insert(schema.objectives).values({ id, menteeId: user.id, title, domain, dueDate, createdAt: Date.now() });
  if (steps.length) await db.insert(schema.objectiveSteps).values(steps.map((t, i) => ({ id: newId(), objectiveId: id, title: t, position: i })));
  revalidatePath("/objectifs");
}

export async function toggleStep(formData: FormData) {
  const user = await requireUser(["MENTEE"]);
  const stepId = String(formData.get("stepId"));
  const [row] = await db.select({ step: schema.objectiveSteps, o: schema.objectives }).from(schema.objectiveSteps)
    .innerJoin(schema.objectives, eq(schema.objectives.id, schema.objectiveSteps.objectiveId))
    .where(eq(schema.objectiveSteps.id, stepId)).limit(1);
  if (!row || row.o.menteeId !== user.id) return;
  await db.update(schema.objectiveSteps).set({ done: !row.step.done }).where(eq(schema.objectiveSteps.id, stepId));
  revalidatePath("/objectifs");
}

export async function addStep(formData: FormData) {
  const user = await requireUser(["MENTEE"]);
  const o = await ownObjective(user.id, String(formData.get("objectiveId")));
  const title = String(formData.get("title") ?? "").trim().slice(0, 140);
  if (!o || !title) return;
  const [p] = await db.select({ p: max(schema.objectiveSteps.position) }).from(schema.objectiveSteps).where(eq(schema.objectiveSteps.objectiveId, o.id));
  await db.insert(schema.objectiveSteps).values({ id: newId(), objectiveId: o.id, title, position: (p?.p ?? 0) + 1 });
  revalidatePath("/objectifs");
}

export async function deleteObjective(formData: FormData) {
  const user = await requireUser(["MENTEE"]);
  const o = await ownObjective(user.id, String(formData.get("objectiveId")));
  if (!o) return;
  await db.delete(schema.objectives).where(eq(schema.objectives.id, o.id));
  revalidatePath("/objectifs");
}

export async function commentObjective(formData: FormData) {
  const user = await requireUser(["MENTOR"]);
  const [o] = await db.select().from(schema.objectives).where(eq(schema.objectives.id, String(formData.get("objectiveId")))).limit(1);
  if (!o || !(await activeMentorship(user.id, o.menteeId))) return;
  const comment = String(formData.get("comment") ?? "").trim().slice(0, 600);
  await db.update(schema.objectives).set({ mentorComment: comment || null, mentorCommentBy: comment ? user.id : null }).where(eq(schema.objectives.id, o.id));
  if (comment) await notify(o.menteeId, "objective_comment", `${user.name} a laissé un conseil sur « ${o.title} ».`, { link: "/objectifs" });
  revalidatePath(`/mentores/${o.menteeId}`);
  revalidatePath("/objectifs");
}
