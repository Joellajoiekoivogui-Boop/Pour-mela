import type { Metadata, Viewport } from "next";
import "@fontsource-variable/nunito";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ServiceWorker } from "@/components/layout/ServiceWorker";
import { ProgressProvider } from "@/components/progress/ProgressProvider";
import { BadgeCelebration } from "@/components/progress/BadgeCelebration";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "CONTEVERSE — Découvre l'Afrique, comprends le monde, imagine demain", template: "%s · CONTEVERSE" },
  description:
    "CONTEVERSE est une plateforme éducative africaine pour les enfants de 7 à 12 ans : carte interactive, Guinée, histoires, quiz, passeport africain et LUMO, le compagnon de lecture.",
  applicationName: "CONTEVERSE",
  appleWebApp: { capable: true, title: "CONTEVERSE", statusBarStyle: "default" },
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon-192.png" },
  openGraph: { title: "CONTEVERSE", description: "Découvre l'Afrique, comprends le monde, imagine demain.", locale: "fr_FR", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#f26a0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh">
        <ProgressProvider>
          <Header />
          <main id="contenu">{children}</main>
          <Footer />
          <BadgeCelebration />
          <ServiceWorker />
        </ProgressProvider>
      </body>
    </html>
  );
}
