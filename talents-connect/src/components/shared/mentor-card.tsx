import Link from "next/link";
import { Briefcase, MapPin, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/misc";
import type { MatchResult } from "@/lib/matching/engine";
import type { MentorListItem } from "@/lib/queries";
import { cn, fullName } from "@/lib/utils";

/**
 * Carte d'un mentor. Avec `match`, affiche le score de compatibilité, son
 * détail par critère et les raisons de la recommandation.
 */
export function MentorCard({
  item, domainName, skillName, profileHref, requestHref, match,
}: {
  item: MentorListItem;
  domainName: (id: number) => string | undefined;
  skillName: (id: number) => string | undefined;
  profileHref: string;
  requestHref?: string;
  match?: MatchResult;
}) {
  const { profile, mentor } = item;
  const skills = item.skillIds.map(skillName).filter(Boolean).slice(0, 5) as string[];
  const domains = item.domainIds.map(domainName).filter(Boolean).slice(0, 3) as string[];
  const scoreTone = match ? (match.score >= 70 ? "text-success" : match.score >= 40 ? "text-primary" : "text-muted") : "";

  return (
    <Card className="flex h-full flex-col p-5 transition-shadow hover:shadow-[var(--shadow-raised)]">
      <div className="flex items-start gap-4">
        <Avatar person={profile} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link href={profileHref} className="font-semibold text-navy hover:text-primary">{fullName(profile)}</Link>
            {match && (
              <div className="text-right">
                <p className={cn("text-xl font-semibold leading-none", scoreTone)}>{match.score}<span className="text-xs font-normal text-muted">/100</span></p>
                <p className="mt-1 text-[11px] text-muted">compatibilité</p>
              </div>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-600">
            <Briefcase className="size-3.5 shrink-0 text-slate-400" aria-hidden />
            <span className="truncate">{[mentor.job_title, mentor.organization].filter(Boolean).join(" · ") || "Professionnel"}</span>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span>{mentor.years_experience} an{mentor.years_experience > 1 ? "s" : ""} d&apos;expérience</span>
            {profile.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3" aria-hidden />{profile.location}</span>}
            {item.rating != null && (
              <span className="inline-flex items-center gap-1"><Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />{item.rating} ({item.reviewCount})</span>
            )}
          </div>
        </div>
      </div>

      {domains.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {domains.map((d) => <Badge key={d} tone="primary">{d}</Badge>)}
          {profile.is_demo && <Badge tone="warning">Profil de démonstration</Badge>}
        </div>
      )}
      {skills.length > 0 && (
        <p className="mt-3 text-sm text-slate-600"><span className="text-muted">Compétences : </span>{skills.join(", ")}</p>
      )}

      {match && (
        <div className="mt-4 space-y-3 rounded-lg bg-subtle/70 p-3.5">
          {match.reasons.length > 0 ? (
            <ul className="space-y-1 text-[13px] text-slate-700">
              {match.reasons.slice(0, 3).map((r) => <li key={r} className="flex gap-2"><span className="text-success" aria-hidden>✓</span>{r}</li>)}
            </ul>
          ) : (
            <p className="text-[13px] text-muted">Peu de points communs avec votre profil actuel.</p>
          )}
          <details className="group text-[13px]">
            <summary className="cursor-pointer select-none font-medium text-primary">Détail du score</summary>
            <ul className="mt-2 space-y-2">
              {match.criteria.map((c) => (
                <li key={c.key}>
                  <div className="flex justify-between text-slate-700"><span>{c.label}</span><span className="font-medium">{c.points}/{c.max}</span></div>
                  <Progress value={(c.points / c.max) * 100} className="mt-1 h-1.5" label={c.label} />
                  <p className="mt-0.5 text-xs text-muted">{c.detail}</p>
                </li>
              ))}
            </ul>
          </details>
          {match.isFull && <Badge tone="warning">Complet pour le moment</Badge>}
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <ButtonLink href={profileHref} variant="secondary" size="sm" className="flex-1">Voir le profil</ButtonLink>
        {requestHref && !match?.isFull && <ButtonLink href={requestHref} size="sm" className="flex-1">Demander un mentorat</ButtonLink>}
      </div>
    </Card>
  );
}
