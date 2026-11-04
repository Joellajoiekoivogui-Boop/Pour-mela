import { Briefcase, GraduationCap, Languages, MapPin, Star, Video } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SESSION_TYPE_LABELS } from "@/lib/labels";
import type { MentorListItem } from "@/lib/queries";
import { formatDate } from "@/lib/dates";
import { fullName } from "@/lib/utils";

export interface PublicReview { id: string; rating: number; comment: string | null; created_at: string }

/** Profil détaillé d'un mentor (page publique et espace mentoré). */
export function MentorProfileView({ item, domainName, skillName, reviews, aside }: {
  item: MentorListItem;
  domainName: (id: number) => string | undefined;
  skillName: (id: number) => string | undefined;
  reviews: PublicReview[];
  aside?: React.ReactNode;
}) {
  const { profile, mentor } = item;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar person={profile} size="xl" />
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-navy">{fullName(profile)}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-slate-600"><Briefcase className="size-4 text-slate-400" aria-hidden />{[mentor.job_title, mentor.organization].filter(Boolean).join(" · ")}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                <span>{mentor.years_experience} ans d&apos;expérience</span>
                {profile.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{profile.location}</span>}
                {item.rating != null && <span className="inline-flex items-center gap-1"><Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />{item.rating}/5 · {item.reviewCount} avis</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge tone="success">Mentor vérifié</Badge>
                {profile.is_demo && <Badge tone="warning">Profil de démonstration</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>

        {profile.bio && (
          <Card><CardHeader><CardTitle>Présentation</CardTitle></CardHeader><CardContent><p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{profile.bio}</p></CardContent></Card>
        )}
        {mentor.experiences && (
          <Card><CardHeader><CardTitle>Expériences professionnelles</CardTitle></CardHeader><CardContent><p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{mentor.experiences}</p></CardContent></Card>
        )}
        {mentor.education && (
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="size-4" />Parcours académique</CardTitle></CardHeader><CardContent><p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{mentor.education}</p></CardContent></Card>
        )}

        <Card>
          <CardHeader><CardTitle>Avis des mentorés</CardTitle></CardHeader>
          <CardContent>
            {reviews.length === 0 ? <p className="text-sm text-muted">Pas encore d&apos;avis.</p> : (
              <ul className="space-y-4">
                {reviews.map((r) => (
                  <li key={r.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <p className="text-amber-500" aria-label={`${r.rating} sur 5`}>{"★".repeat(r.rating)}<span className="text-slate-300">{"★".repeat(5 - r.rating)}</span></p>
                    {r.comment && <p className="mt-1 text-sm text-slate-700">{r.comment}</p>}
                    <p className="mt-1 text-xs text-muted">{formatDate(r.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {aside}
        <Card>
          <CardHeader><CardTitle>Expertise</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-1.5">{item.domainIds.map((id) => <Badge key={id} tone="primary">{domainName(id)}</Badge>)}</div>
            <div className="flex flex-wrap gap-1.5">{item.skillIds.map((id) => <Badge key={id}>{skillName(id)}</Badge>)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Accompagnement</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p className="flex items-start gap-2"><Video className="mt-0.5 size-4 text-slate-400" aria-hidden />{mentor.support_types.map((t) => SESSION_TYPE_LABELS[t]).join(", ")}</p>
            <p className="flex items-start gap-2"><Languages className="mt-0.5 size-4 text-slate-400" aria-hidden />{mentor.languages.join(", ")}</p>
            {mentor.availability_note && <p className="text-muted">Disponibilités : {mentor.availability_note}</p>}
            <p className="text-muted">{item.activeMentees}/{mentor.max_mentees} mentorés accompagnés actuellement</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
