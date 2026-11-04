import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "TALENTS CONNECT — Mentorat numérique", template: "%s · TALENTS CONNECT" },
  description: "Connecter les talents, transmettre les expériences, construire les carrières de demain. Plateforme de mentorat pour les jeunes de Guinée et d'Afrique.",
  applicationName: "TALENTS CONNECT",
};

export const viewport: Viewport = {
  themeColor: "#142B4A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:shadow">
          Aller au contenu
        </a>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
