import type { NextConfig } from "next";

// Site 100 % statique (dossier out/) : il se met en ligne sur Vercel,
// Netlify ou n'importe quel hébergement de fichiers.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
