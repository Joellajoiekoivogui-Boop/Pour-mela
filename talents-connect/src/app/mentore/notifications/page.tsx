import type { Metadata } from "next";
import { NotificationsPage } from "@/components/account/notifications-page";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Notifications" };

export default async function Page() {
  return <NotificationsPage session={await requireRole(["mentee"])} />;
}
