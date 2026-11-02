import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CONTEVERSE — Découvre l'Afrique",
    short_name: "CONTEVERSE",
    description: "Plateforme éducative africaine pour donner aux enfants le goût de la lecture.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8ef",
    theme_color: "#f26a0f",
    lang: "fr",
    orientation: "portrait-primary",
    categories: ["education", "kids", "books"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
