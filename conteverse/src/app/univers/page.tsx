import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/SectionTitle";
import { CategoryCard } from "@/components/home/CategoryCard";
import { categories } from "@/data/categories";
import { articlesByCategory } from "@/data/articles";

export const metadata: Metadata = { title: "Univers de découverte" };

export default function UniversPage() {
  return (
    <>
      <PageHeader eyebrow="12 univers" title="Les univers de découverte">
        Choisis un univers et plonge dans des lectures adaptées à ton âge, toutes accompagnées d&apos;un quiz.
      </PageHeader>
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <CategoryCard key={c.slug} category={c} count={articlesByCategory(c.slug).length} />
        ))}
      </div>
    </>
  );
}
