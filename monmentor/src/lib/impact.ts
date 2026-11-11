import "server-only";
import { db, schema } from "@/db";
import { DEMO_MODE } from "./env";

const DAY = 86_400_000;
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

/** Indicateurs d'impact (spécification F8). Les comptes de démonstration ne comptent qu'en mode démo. */
export async function impactKpis(from = 0, to = Date.now()) {
  const users = (await db.select().from(schema.users)).filter((u) => DEMO_MODE || !u.isDemo);
  const ids = new Set(users.map((u) => u.id));
  const sessions = (await db.select().from(schema.sessions)).filter((s) => ids.has(s.mentorId) && s.startsAt >= from && s.startsAt <= to);
  const now = Date.now();
  const done = (s: (typeof sessions)[number]) => s.status === "COMPLETED" || s.status === "TO_REVIEW";

  const pairs = new Map<string, number>();
  for (const s of sessions) if (done(s) && s.menteeId && s.startsAt >= now - 60 * DAY) pairs.set(`${s.mentorId}:${s.menteeId}`, (pairs.get(`${s.mentorId}:${s.menteeId}`) ?? 0) + 1);
  const activePairs = [...pairs.values()].filter((n) => n >= 2).length;

  const confirmedPast = sessions.filter((s) => (done(s) || s.status === "NO_SHOW") && s.startsAt < now);
  const attendance = confirmedPast.length ? Math.round((confirmedPast.filter(done).length / confirmedPast.length) * 100) : null;

  const objectives = (await db.select().from(schema.objectives)).filter((o) => ids.has(o.menteeId));
  const steps = await db.select().from(schema.objectiveSteps);
  const due = objectives.filter((o) => o.dueDate && Date.parse(`${o.dueDate}T23:59:59Z`) < now);
  const achieved = due.filter((o) => { const st = steps.filter((s) => s.objectiveId === o.id); return st.length > 0 && st.every((s) => s.done); });
  const objectivesRate = due.length ? Math.round((achieved.length / due.length) * 100) : null;

  const firstMatchDays: number[] = [];
  for (const u of users.filter((x) => x.role === "MENTEE")) {
    const first = sessions.filter((s) => s.menteeId === u.id && !["REQUESTED", "DECLINED"].includes(s.status)).map((s) => s.createdAt).sort((a, b) => a - b)[0];
    if (first) firstMatchDays.push(Math.max(0, (first - u.createdAt) / DAY));
  }

  const mentors = users.filter((u) => u.role === "MENTOR");
  const cohort = mentors.filter((m) => { const f = sessions.filter((s) => s.mentorId === m.id).map((s) => s.startsAt).sort((a, b) => a - b)[0]; return f !== undefined && f <= now - 90 * DAY; });
  const retained = cohort.filter((m) => sessions.some((s) => s.mentorId === m.id && s.startsAt >= now - 30 * DAY));

  const shares = (await db.select().from(schema.shareEvents)).filter((e) => ids.has(e.userId) && e.createdAt >= from && e.createdAt <= to);
  const byChannel: Record<string, number> = {};
  for (const e of shares) byChannel[e.channel] = (byChannel[e.channel] ?? 0) + 1;

  const notifs = (await db.select().from(schema.notifications)).filter((n) => ids.has(n.userId) && n.channel !== "inapp" && n.createdAt >= now - 30 * DAY);
  const notifStats: Record<string, { sent: number; failed: number }> = {};
  for (const n of notifs) {
    const k = notifStats[n.channel] ?? (notifStats[n.channel] = { sent: 0, failed: 0 });
    if (n.status === "SENT") k.sent++;
    if (n.status === "FAILED") k.failed++;
  }
  const certificates = (await db.select().from(schema.certificates)).filter((c) => ids.has(c.userId) && !c.revokedAt).length;

  return {
    includesDemo: DEMO_MODE,
    members: { mentees: users.filter((u) => u.role === "MENTEE").length, mentors: mentors.length },
    activePairs,
    attendance,
    objectivesRate,
    medianDaysToFirstMatch: median(firstMatchDays),
    mentorRetention: cohort.length ? Math.round((retained.length / cohort.length) * 100) : null,
    sessionsDone: sessions.filter(done).length,
    hours: Math.round(sessions.filter(done).reduce((a, s) => a + s.durationMin, 0) / 6) / 10,
    certificates,
    shares: byChannel,
    notifications: notifStats,
  };
}
