// Liens de partage du CV (spécification F1). Les réseaux ne prennent qu'une
// adresse : l'aperçu (titre, image) vient des balises Open Graph de la page.

export type ShareChannel = "linkedin" | "facebook" | "whatsapp" | "copy" | "native";

export function withUtm(url: string, channel: ShareChannel): string {
  const u = new URL(url);
  u.searchParams.set("utm_source", channel);
  u.searchParams.set("utm_medium", "cv");
  return u.toString();
}

export function shareUrls(pageUrl: string, message: string) {
  return {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(withUtm(pageUrl, "linkedin"))}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(withUtm(pageUrl, "facebook"))}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${message} ${withUtm(pageUrl, "whatsapp")}`)}`,
  };
}

/** Lien « Ajouter à mon profil LinkedIn » : inscrit un certificat dans « Licences et certifications ». */
export function linkedinAddCertificationUrl(c: {
  name: string;
  issuedAt: number;
  certUrl: string;
  certId: string;
  organizationName?: string;
  organizationId?: string;
}): string {
  const d = new Date(c.issuedAt);
  const p = new URLSearchParams({ startTask: "CERTIFICATION_NAME", name: c.name });
  if (c.organizationId) p.set("organizationId", c.organizationId);
  else p.set("organizationName", c.organizationName ?? "MonMentor");
  p.set("issueYear", String(d.getUTCFullYear()));
  p.set("issueMonth", String(d.getUTCMonth() + 1));
  p.set("certUrl", c.certUrl);
  p.set("certId", c.certId);
  return `https://www.linkedin.com/profile/add?${p.toString()}`;
}
