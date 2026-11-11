import type { MetadataRoute } from "next";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { listPublicMentors } from "@/lib/queries";
import { siteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const fixed = ["", "/mentors", "/programmes", "/devenir-mentor", "/charte", "/confidentialite", "/conditions", "/mentions-legales", "/contact"].map((p) => ({ url: `${base}${p}` }));
  const mentors = (await listPublicMentors()).map((m) => ({ url: `${base}/mentors/${m.id}` }));
  const programs = (await db.select({ slug: schema.programs.slug }).from(schema.programs)).map((p) => ({ url: `${base}/programmes/${p.slug}` }));
  const resources = (await db.select({ id: schema.resources.id }).from(schema.resources).where(eq(schema.resources.hidden, false))).map((r) => ({ url: `${base}/ressources/${r.id}` }));
  const cvs = (await db.select({ slug: schema.careerProfiles.slug }).from(schema.careerProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.careerProfiles.userId))
    .where(and(eq(schema.careerProfiles.visibility, "PUBLIC"), eq(schema.users.isDemo, false)))).map((c) => ({ url: `${base}/cv/${c.slug}` }));
  return [...fixed, ...mentors, ...programs, ...resources, ...cvs];
}
