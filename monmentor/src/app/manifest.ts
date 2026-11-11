import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MonMentor",
    short_name: "MonMentor",
    description: "Le mentorat qui connecte les jeunes talents de Guinée à des professionnels vérifiés.",
    lang: "fr",
    start_url: "/accueil",
    display: "standalone",
    background_color: "#f5f7fa",
    theme_color: "#1b2533",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
