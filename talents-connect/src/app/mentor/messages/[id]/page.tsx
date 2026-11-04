import type { Metadata } from "next";
import { ConversationPage } from "@/components/messages/pages";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Conversation" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireRole(["mentor"]);
  return <ConversationPage session={session} basePath="/mentor" id={id} />;
}
