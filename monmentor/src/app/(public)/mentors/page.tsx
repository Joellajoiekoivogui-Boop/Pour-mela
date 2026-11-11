import type { Metadata } from "next";
import { listPublicMentors } from "@/lib/queries";
import { MentorCard } from "@/components/mentor-card";
import { DOMAINS, FORMATS } from "@/lib/domains";
import { normalize } from "@/lib/matching";
import { PageHeader, EmptyState } from "@/components/ui";
import { plural } from "@/lib/format";

export const metadata: Metadata = { title: "Les mentors", description: "Des professionnels vérifiés, en Guinée et dans la diaspora, prêts à accompagner les jeunes talents." };
export const dynamic = "force-dynamic";

export default async function MentorsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const all = await listPublicMentors();
  const q = normalize(sp.q ?? "");
  const mentors = all.filter((m) =>
    (!sp.domaine || m.primaryDomain === sp.domaine || m.domains.includes(sp.domaine)) &&
    (!sp.format || m.formats.includes(sp.format)) &&
    (!sp.places || m.capacity - m.activeMentees > 0) &&
    (!q || normalize([m.name, m.title, m.organization ?? "", m.city, ...m.skills].join(" ")).includes(q)),
  );
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader eyebrow={plural(all.length, "mentor vérifié", "mentors vérifiés")} title="Les mentors" lead="Consultez librement les profils. Un compte gratuit suffit pour demander un mentorat." />
      <form className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto_auto]" method="get">
        <label className="field"><span className="label">Rechercher</span><input className="input" name="q" defaultValue={sp.q} placeholder="Nom, compétence, ville…" /></label>
        <label className="field"><span className="label">Domaine</span>
          <select className="input" name="domaine" defaultValue={sp.domaine ?? ""}>
            <option value="">Tous les domaines</option>
            {DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </label>
        <label className="field"><span className="label">Format</span>
          <select className="input" name="format" defaultValue={sp.format ?? ""}>
            <option value="">Tous les formats</option>
            {FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" name="places" value="1" defaultChecked={!!sp.places} className="h-4 w-4 accent-[var(--accent)]" /> Places libres</label>
        <button className="btn-dark self-end">Filtrer</button>
      </form>
      {mentors.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{mentors.map((m) => <MentorCard key={m.id} m={m} />)}</div>
      ) : (
        <EmptyState title="Aucun mentor ne correspond à ces filtres." action={{ href: "/mentors", label: "Effacer les filtres" }} />
      )}
    </div>
  );
}
