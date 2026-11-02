import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/SectionTitle";
import { LibraryBrowser } from "@/components/articles/LibraryBrowser";
import { articles } from "@/data/articles";

export const metadata: Metadata = { title: "Bibliothèque éducative", description: "Des articles illustrés et sourcés sur l'Afrique, à lire, à écouter et à tester avec un quiz." };

export default function LibraryPage() {
  return (
    <>
      <PageHeader eyebrow="Bibliothèque" title="La bibliothèque éducative">
        {articles.length} lectures illustrées, sourcées et accompagnées d&apos;un quiz. Filtre par catégorie, pays, niveau, âge ou durée.
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <LibraryBrowser articles={articles} />
      </div>
    </>
  );
}
