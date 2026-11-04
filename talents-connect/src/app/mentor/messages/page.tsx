import type { Metadata } from "next";
import { ConversationsPage } from "@/components/messages/pages";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Messagerie" };

export default async function Page() {
  const session = await requireRole(["mentor"]);
  return <ConversationsPage session={session} basePath="/mentor" />;
}
