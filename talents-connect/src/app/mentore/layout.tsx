import { RoleLayout } from "@/components/layout/role-layout";

export const dynamic = "force-dynamic";

export default function MenteeLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayout roles={["mentee"]} basePath="/mentore">{children}</RoleLayout>;
}
