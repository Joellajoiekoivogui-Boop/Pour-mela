import type { ColorToken } from "@/types/content";

/** Classes Tailwind par couleur de la palette (écrites en entier pour le scan Tailwind). */
export const tone: Record<ColorToken, { solid: string; soft: string; text: string; ring: string; grad: string }> = {
  orange: { solid: "bg-orange-500 text-white", soft: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200", grad: "from-orange-400 to-orange-600" },
  vert: { solid: "bg-vert-500 text-white", soft: "bg-vert-50", text: "text-vert-700", ring: "ring-vert-100", grad: "from-vert-400 to-vert-600" },
  jaune: { solid: "bg-jaune-400 text-encre", soft: "bg-jaune-50", text: "text-jaune-600", ring: "ring-jaune-100", grad: "from-jaune-300 to-jaune-400" },
  violet: { solid: "bg-violet-500 text-white", soft: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-100", grad: "from-violet-400 to-violet-600" },
  bleu: { solid: "bg-bleu-500 text-white", soft: "bg-bleu-50", text: "text-bleu-700", ring: "ring-bleu-100", grad: "from-bleu-400 to-bleu-600" },
};

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
