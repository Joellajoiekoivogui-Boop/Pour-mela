import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireUser(["ADMIN"]);
  return (
    <div className="grid gap-6">
      <nav aria-label="Coordination" className="flex flex-wrap gap-2 text-sm">
        {[["/admin", "Tableau d'impact"], ["/admin/mentors", "Vérifications"], ["/admin/signalements", "Signalements"], ["/admin/certificats", "Certificats"], ["/admin/journal", "Journal"]].map(([h, l]) => (
          <Link key={h} href={h} className="rounded-full bg-surface-2 px-3 py-1.5 font-semibold text-ink-2 hover:text-ink">{l}</Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
