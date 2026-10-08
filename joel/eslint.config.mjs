import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    // Les objets Three.js vivent hors de React : la boucle de rendu les
    // modifie à chaque image, c'est voulu (modèle habituel de React Three Fiber).
    files: ["src/components/fx/Orb.tsx"],
    rules: { "react-hooks/immutability": "off" },
  },
  { ignores: [".next/**", "out/**", "next-env.d.ts"] },
];

export default config;
