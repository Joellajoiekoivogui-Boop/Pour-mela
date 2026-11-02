import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/SectionTitle";
import { LumoChat } from "@/components/assistant/LumoChat";

export const metadata: Metadata = { title: "LUMO — l'assistant éducatif", description: "Pose tes questions sur la Guinée, l'Afrique et les sciences à LUMO." };

export default async function AssistantPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return (
    <>
      <PageHeader eyebrow="CONTEVERSE AI" title="Pose ta question à LUMO">
        LUMO explique avec des mots simples, s&apos;appuie sur les lectures vérifiées de CONTEVERSE et te propose toujours un article pour aller plus loin.
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <LumoChat initialQuestion={typeof q === "string" ? q.slice(0, 400) : undefined} />
      </div>
    </>
  );
}
