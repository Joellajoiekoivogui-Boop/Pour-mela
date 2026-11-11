import { describe, expect, it } from "vitest";
import { displayStatus, nextStoredStatus } from "@/lib/session-status";
import { linkedinAddCertificationUrl, shareUrls } from "@/lib/share";
import { ageFrom, isMinor, plural } from "@/lib/format";

const H = 3_600_000;
const base = { startsAt: 10 * H, durationMin: 60, joinedAtMentor: null, joinedAtMentee: null };

describe("statut des séances", () => {
  it("une séance confirmée passée n'est plus « à venir »", () => {
    expect(displayStatus({ ...base, status: "CONFIRMED", joinedAtMentor: 10 * H }, 12 * H)).toBe("TO_REVIEW");
  });
  it("personne connecté après 15 minutes : absence", () => {
    expect(displayStatus({ ...base, status: "CONFIRMED" }, 10 * H + 16 * 60_000)).toBe("NO_SHOW");
    expect(displayStatus({ ...base, status: "CONFIRMED" }, 10 * H + 5 * 60_000)).toBe("LIVE");
  });
  it("se clôture quand compte rendu et avis sont là, ou après 7 jours", () => {
    const s = { ...base, status: "TO_REVIEW" as const, summary: null, rating: null };
    expect(nextStoredStatus(s, 12 * H)).toBeNull();
    expect(nextStoredStatus({ ...s, summary: "ok", rating: 5 }, 12 * H)).toBe("COMPLETED");
    expect(nextStoredStatus(s, 11 * H + 7 * 24 * H)).toBe("COMPLETED");
  });
  it("une demande sans réponse à l'heure prévue est refusée", () => {
    expect(nextStoredStatus({ ...base, status: "REQUESTED", summary: null, rating: null }, 10 * H)).toBe("DECLINED");
  });
});

describe("partage", () => {
  it("construit les liens des trois réseaux avec le suivi par canal", () => {
    const u = shareUrls("https://monmentor.example/cv/mariama", "Mon parcours :");
    expect(u.linkedin).toContain("linkedin.com/sharing/share-offsite/?url=");
    expect(decodeURIComponent(u.linkedin)).toContain("utm_source=linkedin");
    expect(u.facebook).toContain("facebook.com/sharer/sharer.php?u=");
    expect(decodeURIComponent(u.whatsapp)).toMatch(/^https:\/\/wa\.me\/\?text=Mon parcours : https:\/\/monmentor\.example\/cv\/mariama\?utm_source=whatsapp/);
  });
  it("pré-remplit le certificat LinkedIn", () => {
    const u = new URL(linkedinAddCertificationUrl({ name: "Parcours Numérique", issuedAt: Date.UTC(2026, 10, 3), certUrl: "https://x/verif/MM-1", certId: "MM-1" }));
    expect(u.searchParams.get("startTask")).toBe("CERTIFICATION_NAME");
    expect(u.searchParams.get("issueMonth")).toBe("11");
    expect(u.searchParams.get("organizationName")).toBe("MonMentor");
  });
});

describe("mise en forme", () => {
  it("accorde le pluriel", () => {
    expect(plural(1, "séance")).toBe("1 séance");
    expect(plural(3, "séance")).toBe("3 séances");
  });
  it("calcule l'âge et la minorité", () => {
    const now = new Date(Date.UTC(2026, 10, 10));
    expect(ageFrom("2008-11-11", now)).toBe(17);
    expect(isMinor("2008-11-10", now)).toBe(false);
  });
});
