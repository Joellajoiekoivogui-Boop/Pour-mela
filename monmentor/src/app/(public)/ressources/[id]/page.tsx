import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { RichText } from "@/components/ui";
import { ReportButton } from "@/components/report-button";
import { domainLabel } from "@/lib/domains";
import { formatDate } from "@/lib/format";

async function load(id: string) {
  const [row] = await db.select({ r: schema.resources, author: schema.users, p: schema.mentorProfiles }).from(schema.resources)
    .innerJoin(schema.users, eq(schema.users.id, schema.resources.authorId))
    .leftJoin(schema.mentorProfiles, eq(schema.mentorProfiles.userId, schema.resources.authorId))
    .where(eq(schema.resources.id, id)).limit(1);
  return row && !row.r.hidden ? row : null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const row = await load((await params).id);
  return row ? { title: row.r.title, description: row.r.summary } : { title: "Ressource introuvable" };
}

export default async function ResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await load(id);
  if (!row) notFound();
  const user = await getCurrentUser();
  const { r, author, p } = row;
  return (
    <article className="mx-auto grid max-w-2xl gap-5 px-4 py-10">
      <Link href={user ? "/ressources" : "/"} className="text-sm text-ink-2 hover:text-ink">← {user ? "Bibliothèque" : "MonMentor"}</Link>
      <p className="eyebrow">{r.type} · {domainLabel(r.domain)} · {r.minutes} min</p>
      <h1 className="text-3xl font-bold">{r.title}</h1>
      <p className="text-lg text-ink-2">{r.summary}</p>
      <p className="text-sm text-ink-3">Par <Link href={`/mentors/${author.id}`} className="link">{author.name}</Link>{p ? `, ${p.title}` : ""} · {formatDate(r.createdAt)}</p>
      <div className="card p-6"><RichText text={r.body} /></div>
      {user && <div className="justify-self-end"><ReportButton targetType="RESOURCE" targetId={r.id} targetUserId={author.id} /></div>}
      {!user && <p className="rounded-lg bg-accent-soft p-4 text-sm">Envie d&apos;aller plus loin avec {author.name.split(" ")[0]} ? <Link href={`/mentors/${author.id}`} className="link">Voir son profil de mentor</Link></p>}
    </article>
  );
}
