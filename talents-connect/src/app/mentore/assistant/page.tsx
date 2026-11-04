import type { Metadata } from "next";
import { Assistant } from "@/components/assistant/assistant";
import { PageHeader } from "@/components/layout/page-header";
import { isAiConfigured } from "@/lib/ai/provider";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Assistant IA" };

export default async function Page({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  await requireRole(["mentee"]);
  const { mode } = await searchParams;
  const initial = mode === "path" || mode === "career" ? mode : "orientation";
  return (
    <>
      <PageHeader title="Assistant IA" description="Orientation, CV, lettre de motivation, entretien, parcours d'apprentissage : un premier niveau d'aide, à approfondir avec votre mentor." />
      <Assistant modes={["orientation", "career", "path"]} initialMode={initial} aiEnabled={isAiConfigured()} goalsHref="/mentore/objectifs" />
    </>
  );
}
