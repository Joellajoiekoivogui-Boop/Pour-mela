import localFont from "next/font/local";

// Polices hébergées avec le site (licence SIL OFL, voir src/fonts/) :
// aucune requête vers Google, le texte s'affiche tout de suite.
export const sora = localFont({
  src: "../fonts/sora-latin.woff2",
  weight: "100 800",
  variable: "--font-sora",
  display: "swap",
});

export const inter = localFont({
  src: "../fonts/inter-latin.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

export const grotesk = localFont({
  src: "../fonts/space-grotesk-latin.woff2",
  weight: "300 700",
  variable: "--font-grotesk",
  display: "swap",
});
