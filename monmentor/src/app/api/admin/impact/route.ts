import { getCurrentUser } from "@/lib/auth";
import { impactKpis } from "@/lib/impact";

export async function GET() {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") return new Response("Accès réservé à la coordination", { status: 403 });
  const k = await impactKpis();
  const rows: [string, string | number | null][] = [
    ["Date", new Date().toISOString().slice(0, 10)],
    ["Comptes de démonstration inclus", k.includesDemo ? "oui" : "non"],
    ["Mentorés", k.members.mentees], ["Mentors", k.members.mentors],
    ["Jumelages actifs (>= 2 séances sur 60 jours)", k.activePairs],
    ["Taux de présence (%)", k.attendance], ["Objectifs atteints avant échéance (%)", k.objectivesRate],
    ["Délai médian du premier jumelage (jours)", k.medianDaysToFirstMatch === null ? null : Math.round(k.medianDaysToFirstMatch)],
    ["Rétention des mentors à 3 mois (%)", k.mentorRetention],
    ["Séances terminées", k.sessionsDone], ["Heures d'accompagnement", k.hours], ["Certificats délivrés", k.certificates],
    ...Object.entries(k.shares).map(([c, n]) => [`CV partagés (${c})`, n] as [string, number]),
  ];
  const csv = "﻿Indicateur;Valeur\n" + rows.map(([a, b]) => `"${a.replace(/"/g, '""')}";${b ?? ""}`).join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="monmentor-impact-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
