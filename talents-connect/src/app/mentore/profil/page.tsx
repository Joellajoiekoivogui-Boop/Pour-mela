import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { AvatarUpload } from "@/components/forms/avatar-upload";
import { MenteeProfileForm } from "@/components/forms/profile-forms";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/misc";
import { requireRole } from "@/lib/auth";
import { getCatalog } from "@/lib/queries";
import type { MenteeProfile } from "@/types/db";

export const metadata: Metadata = { title: "Mon profil" };

export default async function MenteeProfilePage({ searchParams }: { searchParams: Promise<{ bienvenue?: string }> }) {
  const { bienvenue } = await searchParams;
  const { supabase, profile } = await requireRole(["mentee"]);
  const [{ domains, skills }, mp, ud, us] = await Promise.all([
    getCatalog(),
    supabase.from("mentee_profiles").select("*").eq("user_id", profile.id).maybeSingle<MenteeProfile>(),
    supabase.from("user_domains").select("domain_id").eq("user_id", profile.id),
    supabase.from("user_skills").select("skill_id, relation").eq("user_id", profile.id),
  ]);
  const m = mp.data;
  const userSkills = (us.data ?? []) as { skill_id: number; relation: string }[];

  return (
    <>
      <PageHeader title="Mon profil" description="Plus votre profil est précis, plus les recommandations de mentors sont pertinentes." />
      {bienvenue && <Alert tone="success" title="Bienvenue sur TALENTS CONNECT !" className="mb-6">Commencez par compléter votre profil : domaines recherchés, compétences et objectifs.</Alert>}
      <Card className="mb-6"><CardContent><AvatarUpload person={profile} /></CardContent></Card>
      <MenteeProfileForm
        domains={domains} skills={skills}
        defaults={{
          firstName: profile.first_name, lastName: profile.last_name, location: profile.location ?? "", bio: profile.bio ?? "",
          birthDate: m?.birth_date ?? "", educationLevel: (m?.education_level ?? "") as never, institution: m?.institution ?? "",
          fieldOfStudy: m?.field_of_study ?? "", interests: m?.interests ?? "", professionalGoals: m?.professional_goals ?? "",
          projectNeeds: m?.project_needs ?? "",
          domainIds: ((ud.data ?? []) as { domain_id: number }[]).map((d) => d.domain_id),
          skillIds: userSkills.filter((s) => s.relation === "wants").map((s) => s.skill_id),
          hasSkillIds: userSkills.filter((s) => s.relation === "has").map((s) => s.skill_id),
        }}
      />
    </>
  );
}
