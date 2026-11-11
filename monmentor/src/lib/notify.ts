import "server-only";
import { and, eq, inArray, lte } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Channel } from "@/db/schema";
import { newId } from "./ids";
import { siteUrl } from "./env";
import { formatDateTime } from "./format";

// Notifications (spécification F4) : chaque événement crée une notification
// dans l'application et, si possible, un message sur le canal préféré du
// membre (WhatsApp, SMS, e-mail). Les envois externes passent par une file
// traitée par la tâche planifiée (scripts/jobs.ts ou /api/cron/jobs).

type Recipient = { phone?: string | null; email?: string | null };
type SendResult = { ok: true } | { ok: false; error: string };

const QUIET_START = 22; // heure de Conakry (UTC+0)
const QUIET_END = 7;

export function inQuietHours(ms: number): boolean {
  const h = new Date(ms).getUTCHours();
  return h >= QUIET_START || h < QUIET_END;
}

function nextMorning(ms: number): number {
  const d = new Date(ms);
  if (d.getUTCHours() >= QUIET_START) d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(QUIET_END, 0, 0, 0);
  return d.getTime();
}

async function sendWhatsApp(phone: string, text: string): Promise<SendResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { ok: false, error: "WhatsApp non configuré" };
  // Messages à l'initiative de la plateforme : modèle pré-approuvé par Meta, avec une variable de texte.
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone.replace(/^\+/, ""),
      type: "template",
      template: {
        name: process.env.WHATSAPP_TEMPLATE ?? "monmentor_notification",
        language: { code: process.env.WHATSAPP_TEMPLATE_LANG ?? "fr" },
        components: [{ type: "body", parameters: [{ type: "text", text: text.slice(0, 1000) }] }],
      },
    }),
    signal: AbortSignal.timeout(10_000),
  });
  return res.ok ? { ok: true } : { ok: false, error: `WhatsApp ${res.status}` };
}

async function postWebhook(url: string | undefined, token: string | undefined, payload: object, label: string): Promise<SendResult> {
  if (!url) return { ok: false, error: `${label} non configuré` };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });
  return res.ok ? { ok: true } : { ok: false, error: `${label} ${res.status}` };
}

const sendSms = (phone: string, text: string) =>
  postWebhook(process.env.SMS_WEBHOOK_URL, process.env.SMS_WEBHOOK_TOKEN, { to: phone, text: text.slice(0, 320) }, "SMS");
const sendEmail = (email: string, text: string) =>
  postWebhook(process.env.EMAIL_WEBHOOK_URL, process.env.EMAIL_WEBHOOK_TOKEN, { to: email, subject: "MonMentor", text }, "E-mail");

const anyProvider = () =>
  !!(process.env.WHATSAPP_TOKEN || process.env.SMS_WEBHOOK_URL || process.env.EMAIL_WEBHOOK_URL);

export async function deliver(channel: Channel, to: Recipient, text: string): Promise<SendResult> {
  if (!anyProvider()) {
    console.info(`[notification:${channel}] ${to.phone ?? to.email ?? "?"} : ${text}`);
    return { ok: true };
  }
  try {
    if (channel === "whatsapp" && to.phone) return await sendWhatsApp(to.phone, text);
    if (channel === "sms" && to.phone) return await sendSms(to.phone, text);
    if (channel === "email" && to.email) return await sendEmail(to.email, text);
    return { ok: false, error: "Aucune adresse pour ce canal" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur d'envoi" };
  }
}

/** Envoi immédiat (codes de connexion) : WhatsApp, puis SMS en secours. */
export async function sendNow(to: Recipient, text?: string): Promise<SendResult>;
export async function sendNow(args: Recipient & { text: string }): Promise<SendResult>;
export async function sendNow(a: Recipient & { text?: string }, maybeText?: string): Promise<SendResult> {
  const text = maybeText ?? a.text ?? "";
  if (a.phone) {
    const wa = await deliver("whatsapp", a, text);
    if (wa.ok) return wa;
    return deliver("sms", a, text);
  }
  if (a.email) return deliver("email", a, text);
  return { ok: false, error: "Aucun destinataire" };
}

type QueueOpts = { link?: string; scheduledAt?: number; sessionId?: string; urgent?: boolean; inApp?: boolean };

/** Crée la notification dans l'application et met en file l'envoi externe. */
export async function notify(userId: string, type: string, body: string, opts: QueueOpts = {}) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) return;
  const now = Date.now();
  const scheduledAt = opts.scheduledAt ?? now;
  const rows: (typeof schema.notifications.$inferInsert)[] = [];
  if (opts.inApp !== false && scheduledAt <= now) {
    rows.push({ id: newId(), userId, type, channel: "inapp", body, link: opts.link ?? null, status: "SENT", scheduledAt: now, sentAt: now, sessionId: opts.sessionId ?? null, createdAt: now });
  }
  let channel: Channel | null = user.preferredChannel;
  if ((channel === "whatsapp" || channel === "sms") && !user.phone) channel = user.email ? "email" : null;
  if (channel === "email" && !user.email) channel = user.phone ? "sms" : null;
  if (channel) {
    rows.push({ id: newId(), userId, type, channel, body, link: opts.link ?? null, status: "QUEUED", scheduledAt, sessionId: opts.sessionId ?? null, urgent: !!opts.urgent, createdAt: now });
  }
  if (rows.length) await db.insert(schema.notifications).values(rows);
}

export async function scheduleSessionReminders(s: {
  id: string; title: string; startsAt: number; durationMin: number; mentorId: string; menteeId: string | null; mentorName: string; menteeName: string;
}) {
  const now = Date.now();
  const link = `/seances/${s.id}`;
  const when = formatDateTime(s.startsAt);
  const people = [
    { id: s.mentorId, other: s.menteeName },
    ...(s.menteeId ? [{ id: s.menteeId, other: s.mentorName }] : []),
  ];
  for (const p of people) {
    const dayBefore = s.startsAt - 24 * 3_600_000;
    if (dayBefore > now) {
      await notify(p.id, "reminder_day", `Demain : séance « ${s.title} » avec ${p.other}, ${when}. ${siteUrl()}${link}`, { link, scheduledAt: dayBefore, sessionId: s.id, inApp: false });
    }
    const hourBefore = s.startsAt - 3_600_000;
    if (hourBefore > now) {
      await notify(p.id, "reminder_hour", `Dans 1 h : séance « ${s.title} ». Connexion faible ? Rejoignez en audio seul. ${siteUrl()}${link}`, { link, scheduledAt: hourBefore, sessionId: s.id, urgent: true, inApp: false });
    }
  }
  if (s.menteeId) {
    await notify(s.menteeId, "rating_request", `Comment s'est passée votre séance « ${s.title} » ? Donnez votre avis : ${siteUrl()}${link}`, {
      link, scheduledAt: s.startsAt + s.durationMin * 60_000 + 3_600_000, sessionId: s.id, inApp: false,
    });
  }
}

export async function cancelSessionReminders(sessionId: string) {
  await db
    .update(schema.notifications)
    .set({ status: "CANCELLED" })
    .where(and(eq(schema.notifications.sessionId, sessionId), eq(schema.notifications.status, "QUEUED")));
}

/** Traite la file : appelé par la tâche planifiée. */
export async function dispatchDue(now = Date.now(), limit = 200) {
  const due = await db
    .select({ n: schema.notifications, u: schema.users })
    .from(schema.notifications)
    .innerJoin(schema.users, eq(schema.users.id, schema.notifications.userId))
    .where(and(eq(schema.notifications.status, "QUEUED"), lte(schema.notifications.scheduledAt, now)))
    .limit(limit);
  let sent = 0, failed = 0, deferred = 0;
  const toCopyInApp: (typeof schema.notifications.$inferInsert)[] = [];
  for (const { n, u } of due) {
    if (!n.urgent && inQuietHours(now)) {
      await db.update(schema.notifications).set({ scheduledAt: nextMorning(now) }).where(eq(schema.notifications.id, n.id));
      deferred++;
      continue;
    }
    const res = await deliver(n.channel as Channel, u, n.body);
    if (res.ok) {
      await db.update(schema.notifications).set({ status: "SENT", sentAt: now }).where(eq(schema.notifications.id, n.id));
      sent++;
      if (n.type.startsWith("reminder") || n.type === "rating_request") {
        toCopyInApp.push({ id: newId(), userId: n.userId, type: n.type, channel: "inapp", body: n.body, link: n.link, status: "SENT", scheduledAt: now, sentAt: now, sessionId: n.sessionId, createdAt: now });
      }
    } else {
      await db.update(schema.notifications).set({ status: "FAILED", error: res.error }).where(eq(schema.notifications.id, n.id));
      failed++;
      if (n.channel === "whatsapp" && u.phone) {
        // Repli : SMS cinq minutes plus tard.
        await db.insert(schema.notifications).values({ ...n, id: newId(), channel: "sms", status: "QUEUED", scheduledAt: now + 5 * 60_000, error: null, createdAt: now });
      }
    }
  }
  if (toCopyInApp.length) await db.insert(schema.notifications).values(toCopyInApp);
  return { sent, failed, deferred };
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  const where = ids?.length
    ? and(eq(schema.notifications.userId, userId), inArray(schema.notifications.id, ids))
    : and(eq(schema.notifications.userId, userId), eq(schema.notifications.channel, "inapp"));
  await db.update(schema.notifications).set({ readAt: Date.now() }).where(where);
}
