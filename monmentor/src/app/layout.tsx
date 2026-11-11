import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteUrl } from "@/lib/env";
import { ServiceWorker } from "@/components/service-worker";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "MonMentor · Un mentor pour vos ambitions", template: "%s · MonMentor" },
  description:
    "MonMentor met en relation les jeunes talents de Guinée avec des professionnels vérifiés : recommandation de mentors, séances en visio ou en présentiel, objectifs suivis, CV partageable.",
  applicationName: "MonMentor",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "MonMentor",
    title: "MonMentor · Un mentor pour vos ambitions",
    description: "Décrivez votre besoin, rencontrez un professionnel qui est passé par là.",
  },
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#1b2533",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh antialiased">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
