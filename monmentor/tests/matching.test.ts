import { describe, expect, it } from "vitest";
import { DEMO_MENTORS, REFERENCE_CASES } from "@/lib/demo-data";
import { extractNeedKeywords, recommend, scoreMentor, type MentorCandidate, type Need } from "@/lib/matching";

const candidates: MentorCandidate[] = DEMO_MENTORS.filter((m) => m.verificationLevel >= 2).map((m) => ({
  id: m.key, name: m.name, city: m.city, country: m.country, primaryDomain: m.primaryDomain,
  domains: m.domains, skills: m.skills, languages: m.languages, formats: m.formats,
  capacity: m.capacity, activeMentees: 0, ratingAvg: null, ratingCount: 0,
}));

function needOf(text: string, city = "Conakry"): Need {
  return { ...extractNeedKeywords(text), city, country: "Guinée" };
}

describe("lecture du besoin", () => {
  it("ne confond plus « projet concret » avec l'entrepreneuriat", () => {
    const n = extractNeedKeywords("Je veux construire un projet concret à montrer pour mon master en IA");
    expect(n.domains).not.toContain("entrepreneuriat");
    expect(n.skills).toContain("Intelligence artificielle");
    expect(n.skills).toContain("Portfolio GitHub");
  });
  it("reconnaît un projet agricole", () => {
    const n = extractNeedKeywords("Je veux créer mon entreprise de transformation agricole");
    expect(n.domains).toEqual(expect.arrayContaining(["agri", "entrepreneuriat"]));
  });
  it("repère le présentiel et les langues", () => {
    const n = extractNeedKeywords("Je préfère rencontrer mon mentor en personne et parler pular");
    expect(n.presentielRequired).toBe(true);
    expect(n.languages).toEqual(["Pular"]);
  });
});

describe("recommandation", () => {
  it("place la fondatrice agroalimentaire devant l'éditrice pour un projet agricole", () => {
    const res = recommend(needOf("Je veux créer mon entreprise de transformation agricole"), candidates);
    expect(res[0].mentor.id).toBe("fatoumata");
    const editrice = res.findIndex((r) => r.mentor.id === "mariame");
    expect(editrice === -1 || editrice > 0).toBe(true);
  });

  it("place l'ingénieur IA dans le top 2 pour un master en IA", () => {
    const res = recommend(needOf("Master en IA en France"), candidates);
    expect(res.slice(0, 2).map((r) => r.mentor.id)).toContain("ibrahima");
  });

  it("exclut un mentor complet, sauf s'il accompagne déjà le jeune", () => {
    const full = { ...candidates[0], capacity: 2, activeMentees: 2 };
    expect(scoreMentor(needOf("transformation agricole"), full)).toBeNull();
    expect(scoreMentor(needOf("transformation agricole"), { ...full, alreadyRelated: true })).not.toBeNull();
  });

  it("met G à zéro quand le présentiel est exigé dans une autre ville", () => {
    const s = scoreMentor({ ...needOf("rencontrer en personne", "Kindia") }, candidates[0])!;
    expect(s.parts.G).toBe(0);
  });

  it(`atteint au moins 90 % de bons mentors dans le top 3 sur ${REFERENCE_CASES.length} besoins de référence`, () => {
    const misses: string[] = [];
    for (const c of REFERENCE_CASES) {
      const top3 = recommend(needOf(c.need, c.city), candidates).slice(0, 3).map((r) => r.mentor.id);
      if (!c.expected.some((e) => top3.includes(e))) misses.push(`${c.need} → ${top3.join(", ")}`);
    }
    const precision = 1 - misses.length / REFERENCE_CASES.length;
    expect(precision, misses.join("\n")).toBeGreaterThanOrEqual(0.9);
  });
});
