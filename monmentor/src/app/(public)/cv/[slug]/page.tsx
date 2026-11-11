import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { canViewCv, cvUrl, loadCv, qrDataUrl } from "@/lib/cv";
import { getCurrentUser } from "@/lib/auth";
import { CvView } from "@/components/cv-view";
import { siteUrl } from "@/lib/env";
import Link from "next/link";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ t?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { t } = await searchParams;
  const d = await loadCv({ slug });
  const viewer = await getCurrentUser();
  if (!d || !canViewCv(d, t, viewer?.id)) return { title: "CV introuvable", robots: { index: false } };
  const title = `${d.user.name} · CV MonMentor`;
  const description = d.cv.headline ?? "Parcours, compétences validées et recommandations sur MonMentor.";
  const image = `${siteUrl()}/api/og/cv/${slug}${d.cv.visibility === "LINK" ? `?t=${d.cv.shareToken}` : ""}`;
  return {
    title, description,
    robots: { index: d.cv.visibility === "PUBLIC", follow: false },
    openGraph: { title, description, type: "profile", url: cvUrl(d), images: [{ url: image, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function PublicCv({ params, searchParams }: Props) {
  const { slug } = await params;
  const { t } = await searchParams;
  const d = await loadCv({ slug });
  const viewer = await getCurrentUser();
  if (!d || !canViewCv(d, t, viewer?.id)) notFound();
  if (viewer?.id !== d.user.id) {
    await db.update(schema.careerProfiles).set({ viewCount: sql`${schema.careerProfiles.viewCount} + 1` }).where(eq(schema.careerProfiles.userId, d.user.id));
  }
  const url = cvUrl(d);
  return (
    <div className="mx-auto grid max-w-3xl gap-4 px-4 py-10">
      {viewer?.id === d.user.id && (
        <p className="rounded-lg bg-info-soft px-4 py-2 text-sm">Aperçu de votre CV tel que le voient les autres. <Link href="/profil/cv" className="link">Modifier</Link></p>
      )}
      <CvView d={d} qr={await qrDataUrl(url)} verifyUrl={url} />
      <p className="text-center text-sm text-ink-3">Ce CV est tenu à jour par MonMentor à partir du parcours réel du membre. <Link href="/" className="link">Découvrir MonMentor</Link></p>
    </div>
  );
}
