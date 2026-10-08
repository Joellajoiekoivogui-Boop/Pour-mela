import type { Metadata, Viewport } from "next";
import { reine } from "@/config/reine";
import { cinzel, cormorant, greatVibes } from "./fonts";
import "./globals.css";

// Adresse publique du site : sert à l'image d'aperçu (WhatsApp l'exige
// complète). Fournie par Vercel, ou par NEXT_PUBLIC_SITE_URL ailleurs.
const site =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: `Pour ${reine.prenom} 👑`,
  description: `Une petite histoire de lumière, rien que pour ${reine.prenom}.`,
  robots: { index: false, follow: false },
  openGraph: {
    title: `Pour ${reine.prenom} 👑`,
    description: "Entre dans ton royaume…",
    type: "website",
    locale: "fr_FR",
  },
  appleWebApp: { capable: true, title: `Pour ${reine.prenom}`, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050208",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" data-scene="void" className={`${cinzel.variable} ${cormorant.variable} ${greatVibes.variable}`}>
      <body>{children}</body>
    </html>
  );
}
