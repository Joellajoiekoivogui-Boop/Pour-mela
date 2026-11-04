import { RoleLayout } from "@/components/layout/role-layout";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayout roles={["admin", "super_admin"]} basePath="/admin">{children}</RoleLayout>;
}
