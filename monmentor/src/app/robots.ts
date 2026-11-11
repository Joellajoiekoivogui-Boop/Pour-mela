import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/accueil", "/seances", "/messages", "/objectifs", "/profil", "/admin", "/mentores", "/trouver", "/notifications", "/connexion", "/inscription", "/consentement", "/verif"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
