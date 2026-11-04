import { RoleLayout } from "@/components/layout/role-layout";

export const dynamic = "force-dynamic";

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayout roles={["mentor"]} basePath="/mentor">{children}</RoleLayout>;
}
