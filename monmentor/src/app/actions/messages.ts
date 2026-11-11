"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, gt, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { activeMentorship } from "@/lib/queries";
import { minorQuietHours } from "@/lib/guards";
import { hit } from "@/lib/rate-limit";
import { notify } from "@/lib/notify";

export async function sendMessage(formData: FormData) {
  const user = await requireUser(["MENTOR", "MENTEE"]);
  const to = String(formData.get("to") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 4000);
  const back = `/messages/${to}`;
  if (!body) redirect(back);
  if (!(await activeMentorship(user.id, to))) redirect(`${back}?erreur=relation`);
  const [recipient] = await db.select().from(schema.users).where(eq(schema.users.id, to)).limit(1);
  if (!recipient) redirect("/messages");
  if (minorQuietHours(user) || minorQuietHours(recipient)) redirect(`${back}?erreur=nuit`);
  if (!(await hit(`msg:${user.id}`, 60, 3_600_000))) redirect(`${back}?erreur=rythme`);
  const now = Date.now();
  await db.insert(schema.messages).values({ id: newId(), senderId: user.id, recipientId: to, body, createdAt: now });
  // Pas plus d'un message externe toutes les deux heures pour une même conversation.
  const [recent] = await db.select({ id: schema.notifications.id }).from(schema.notifications)
    .where(and(eq(schema.notifications.userId, to), eq(schema.notifications.type, `message:${user.id}`), ne(schema.notifications.channel, "inapp"), gt(schema.notifications.createdAt, now - 2 * 3_600_000)))
    .limit(1);
  if (!recent) await notify(to, `message:${user.id}`, `Nouveau message de ${user.name} sur MonMentor.`, { link: `/messages/${user.id}`, inApp: false });
  revalidatePath(back);
  redirect(back);
}
