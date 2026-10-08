import type { Metadata, Viewport } from "next";
import { grotesk, inter, sora } from "./fonts";
import "./globals.css";

// Adresse publique du site : sert à l'image d'aperçu (WhatsApp l'exige
// complète). Fournie par Vercel, ou par NEXT_PUBLIC_SITE_URL ailleurs.
const site =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

const title = "Joyeux anniversaire Joël — 10 octobre";
const description = "Une expérience digitale créée pour célébrer le 10 octobre.";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title,
  description,
  applicationName: "Joël · 10.10",
  openGraph: { title, description, type: "website", locale: "fr_FR", siteName: "Joël · 10.10" },
  twitter: { card: "summary_large_image", title, description },
  appleWebApp: { capable: true, title: "Joël · 10.10", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#05050a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" data-chapter="accueil" className={`${sora.variable} ${inter.variable} ${grotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
