import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { AvatarUpload } from "@/components/forms/avatar-upload";
import { MentorProfileForm } from "@/components/forms/profile-forms";
import { VerificationBadge } from "@/components/shared/status-badges";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/misc";
import { requireRole } from "@/lib/auth";
import { getCatalog } from "@/lib/queries";
import type { MentorProfile } from "@/types/db";

export const metadata: Metadata = { title: "Mon profil mentor" };

export default async function MentorProfilePage({ searchParams }: { searchParams: Promise<{ bienvenue?: string }> }) {
  const { bienvenue } = await searchParams;
  const { supabase, profile } = await requireRole(["mentor"]);
  const [{ domains, skills }, mp, ud, us] = await Promise.all([
    getCatalog(),
    supabase.from("mentor_profiles").select("*").eq("user_id", profile.id).maybeSingle<MentorProfile>(),
    supabase.from("user_domains").select("domain_id").eq("user_id", profile.id),
    supabase.from("user_skills").select("skill_id").eq("user_id", profile.id).eq("relation", "teaches"),
  ]);
  const m = mp.data;
  return (
    <>
      <PageHeader title="Mon profil mentor" description="Ce profil est présenté aux mentorés et utilisé par le moteur de matching." actions={<>
        {m && <VerificationBadge status={m.verification_status} />}
        {m?.verification_status === "verified" && <ButtonLink href={`/mentors/${profile.id}`} variant="secondary" size="sm">Voir mon profil public</ButtonLink>}
      </>} />
      {bienvenue && <Alert tone="success" title="Bienvenue parmi les mentors !" className="mb-6">Complétez votre profil : il sera vérifié par l&apos;équipe avant d&apos;être visible.</Alert>}
      <Card className="mb-6"><CardContent><AvatarUpload person={profile} /></CardContent></Card>
      <MentorProfileForm
        domains={domains} skills={skills}
        defaults={{
          firstName: profile.first_name, lastName: profile.last_name, location: profile.location ?? "", bio: profile.bio ?? "",
          jobTitle: m?.job_title ?? "", organization: m?.organization ?? "", yearsExperience: m?.years_experience ?? 0,
          education: m?.education ?? "", experiences: m?.experiences ?? "", languages: m?.languages ?? ["Français"],
          availabilityNote: m?.availability_note ?? "", supportTypes: m?.support_types ?? ["video"], maxMentees: m?.max_mentees ?? 5,
          domainIds: ((ud.data ?? []) as { domain_id: number }[]).map((d) => d.domain_id),
          skillIds: ((us.data ?? []) as { skill_id: number }[]).map((s) => s.skill_id),
        }}
      />
    </>
  );
}
