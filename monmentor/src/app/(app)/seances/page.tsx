import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { sessionsFor } from "@/lib/queries";
import { displayStatus, isPast, isUpcoming, STATUS_LABEL, type DisplayStatus } from "@/lib/session-status";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { formatDateTime, plural } from "@/lib/format";

export const metadata: Metadata = { title: "Séances" };

const TONE: Record<DisplayStatus, "ok" | "warn" | "info" | "neutral" | "bad" | "accent"> = {
  REQUESTED: "warn", CONFIRMED: "info", LIVE: "ok", TO_REVIEW: "accent", COMPLETED: "neutral", DECLINED: "bad", CANCELLED: "bad", NO_SHOW: "bad",
};
const DAY = 86_400_000;

export default async function SessionsPage({ searchParams }: { searchParams: Promise<{ onglet?: string }> }) {
  const user = await requireUser(["MENTOR", "MENTEE"]);
  const { onglet = "avenir" } = await searchParams;
  const now = Date.now();
  const all = (await sessionsFor(user.id, user.role)).map((s) => ({ ...s, d: displayStatus(s, now) }));
  const tabs = {
    avenir: all.filter((s) => isUpcoming(s.d)),
    passees: all.filter((s) => isPast(s.d)).reverse(),
    annulees: all.filter((s) => s.d === "CANCELLED" || s.d === "DECLINED").reverse(),
  };
  const list = tabs[onglet as keyof typeof tabs] ?? tabs.avenir;
  const hours = all.filter((s) => s.d === "COMPLETED" || s.d === "TO_REVIEW").reduce((a, s) => a + s.durationMin, 0) / 60;
  const start = new Date(); start.setUTCHours(0, 0, 0, 0);
  const week = Array.from({ length: 7 }, (_, i) => start.getTime() + i * DAY);

  return (
    <>
      <PageHeader eyebrow={`${plural(tabs.passees.length, "séance réalisée", "séances réalisées")} · ${hours.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} h d'accompagnement`}
        title="Mes séances"
        lead={user.role === "MENTOR" ? "Programmez les séances de vos mentorés et validez leurs demandes. Rejoignez-les en visio, en audio seul ou par chat." : "Demandez une séance sur les créneaux de votre mentor : elle est confirmée dès sa validation."}
        actions={<Link href="/seances/nouvelle" className="btn-primary">{user.role === "MENTOR" ? "Programmer une séance" : "Demander une séance"}</Link>} />
      <section aria-label="Ma semaine" className="card mb-6 grid grid-cols-7 overflow-x-auto text-center text-xs">
        {week.map((d, i) => {
          const items = all.filter((s) => s.startsAt >= d && s.startsAt < d + DAY && (s.d === "CONFIRMED" || s.d === "LIVE" || s.d === "REQUESTED"));
          return (
            <div key={d} className={`grid min-w-16 content-start gap-1 border-line p-2 ${i ? "border-l" : ""}`}>
              <span className="font-semibold uppercase text-ink-3">{i === 0 ? "Auj." : new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "UTC" }).format(d)}</span>
              <span className="text-lg font-bold">{new Date(d).getUTCDate()}</span>
              {items.map((s) => <Link key={s.id} href={`/seances/${s.id}`} className="truncate rounded bg-accent-soft px-1 py-0.5 text-accent" title={s.title}>{new Date(s.startsAt).getUTCHours()} h</Link>)}
            </div>
          );
        })}
      </section>
      <nav className="mb-4 flex gap-2 text-sm" aria-label="Filtrer les séances">
        {([["avenir", "À venir"], ["passees", "Passées"], ["annulees", "Annulées ou refusées"]] as const).map(([k, l]) => (
          <Link key={k} href={`/seances?onglet=${k}`} aria-current={onglet === k ? "page" : undefined} className={`rounded-full px-3 py-1.5 font-semibold ${onglet === k ? "bg-brand text-brand-ink" : "bg-surface-2 text-ink-2"}`}>
            {l} ({tabs[k].length})
          </Link>
        ))}
      </nav>
      {list.length === 0 ? <EmptyState title="Aucune séance ici." /> : (
        <ul className="grid gap-2">
          {list.map((s) => (
            <li key={s.id}>
              <Link href={`/seances/${s.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-4 hover:border-accent">
                <span><span className="block font-semibold">{s.title}</span><span className="text-sm text-ink-2">{user.role === "MENTOR" ? s.menteeName : s.mentorName} · {formatDateTime(s.startsAt)} · {s.durationMin} min</span></span>
                <Badge tone={TONE[s.d]}>{STATUS_LABEL[s.d]}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
