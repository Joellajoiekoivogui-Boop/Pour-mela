import type { Metadata } from "next";
import { Assistant } from "@/components/assistant/assistant";
import { PageHeader } from "@/components/layout/page-header";
import { isAiConfigured } from "@/lib/ai/provider";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Assistant IA" };

export default async function Page() {
  await requireRole(["mentor"]);
  return (
    <>
      <PageHeader title="Assistant du mentor" description="Préparez vos séances, structurez les objectifs de vos mentorés ou générez un parcours à leur proposer." />
      <Assistant modes={["mentor_prep", "path", "career"]} initialMode="mentor_prep" aiEnabled={isAiConfigured()} />
    </>
  );
}
