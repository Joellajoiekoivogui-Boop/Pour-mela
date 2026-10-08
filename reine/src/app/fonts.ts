import localFont from "next/font/local";

// Polices hébergées avec le site (licence SIL OFL, voir src/fonts/).
export const cinzel = localFont({
  src: "../fonts/cinzel-latin.woff2",
  weight: "400 900",
  variable: "--font-cinzel",
  display: "swap",
});

export const cormorant = localFont({
  src: [
    { path: "../fonts/cormorant-latin.woff2", weight: "300 700", style: "normal" },
    { path: "../fonts/cormorant-italique-latin.woff2", weight: "300 700", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
});

export const greatVibes = localFont({
  src: "../fonts/great-vibes-latin.woff2",
  weight: "400",
  variable: "--font-great-vibes",
  display: "swap",
});
