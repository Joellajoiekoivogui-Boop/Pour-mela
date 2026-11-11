import Link from "next/link";
import type { MentorListItem } from "@/lib/queries";
import { Avatar, DemoBadge, DomainChips, VerifiedBadge } from "./ui";
import { plural } from "@/lib/format";
import { DEMO_MODE } from "@/lib/env";

export function MentorCard({ m, href = `/mentors/${m.id}`, children }: { m: MentorListItem; href?: string; children?: React.ReactNode }) {
  const places = m.capacity - m.activeMentees;
  return (
    <article className="card flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <Avatar name={m.name} size={48} />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">
            <Link href={href} className="hover:underline">{m.name}</Link>
          </h3>
          <p className="text-sm text-ink-2">{m.title}{m.organization ? ` · ${m.organization}` : ""}</p>
          <p className="text-xs text-ink-3">{m.city}{m.country !== "Guinée" ? `, ${m.country}` : ""} · {plural(m.yearsExperience, "an")} d&apos;expérience</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <VerifiedBadge level={m.verificationLevel} />
        <DemoBadge show={DEMO_MODE && m.isDemo} />
        <DomainChips ids={[m.primaryDomain, ...m.domains.filter((d) => d !== m.primaryDomain)].slice(0, 3)} />
      </div>
      {children}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-xs text-ink-2">
        <span>{m.ratingCount >= 3 && m.ratingAvg != null ? `★ ${m.ratingAvg.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}/5 · ${plural(m.ratingCount, "avis", "avis")}` : "Nouveau sur MonMentor"}</span>
        <span className={places > 0 ? "font-semibold text-ok" : "text-ink-3"}>{places > 0 ? plural(places, "place libre", "places libres") : "Complet"}</span>
      </div>
    </article>
  );
}
