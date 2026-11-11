import { requireUser } from "@/lib/auth";
import { unreadCounts } from "@/lib/queries";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const counts = await unreadCounts(user.id);
  return <AppShell user={user} counts={counts}>{children}</AppShell>;
}
