import type { AvatarId } from "@/lib/progress/types";

// Avatars d'enfants africains, dessinés en SVG : tons de peau, coiffures
// et tenues variés. Aucun ne représente une personne réelle.

interface Look {
  name: string;
  skin: string;
  hair: string;
  style: "afro" | "tresses" | "court" | "foulard" | "chignon" | "rase";
  shirt: string;
  accent: string;
}

export const AVATARS: Record<AvatarId, Look> = {
  awa: { name: "Awa", skin: "#8d5524", hair: "#1b1210", style: "tresses", shirt: "#f26a0f", accent: "#ffd84a" },
  kofi: { name: "Kofi", skin: "#6b3e1f", hair: "#140d0a", style: "court", shirt: "#189557", accent: "#ffd84a" },
  mariama: { name: "Mariama", skin: "#a0673a", hair: "#1b1210", style: "foulard", shirt: "#6f48de", accent: "#ff8a2b" },
  sekou: { name: "Sékou", skin: "#7a4524", hair: "#140d0a", style: "afro", shirt: "#1f74d1", accent: "#2fb36d" },
  zara: { name: "Zara", skin: "#5a3218", hair: "#140d0a", style: "chignon", shirt: "#f7c21b", accent: "#6f48de" },
  ibrahim: { name: "Ibrahim", skin: "#94592d", hair: "#140d0a", style: "rase", shirt: "#d1540a", accent: "#1f74d1" },
};

export const AVATAR_IDS = Object.keys(AVATARS) as AvatarId[];

function Hair({ l }: { l: Look }) {
  switch (l.style) {
    case "afro":
      return <circle cx="50" cy="36" r="30" fill={l.hair} />;
    case "tresses":
      return (
        <g fill={l.hair}>
          <path d="M24 44 C22 18 78 18 76 44 C70 30 30 30 24 44 Z" />
          {[26, 34, 66, 74].map((x) => (
            <rect key={x} x={x - 3} y="40" width="6" height="34" rx="3" />
          ))}
          {[26, 34, 66, 74].map((x) => (
            <circle key={`b${x}`} cx={x} cy="76" r="3.5" fill={l.accent} />
          ))}
        </g>
      );
    case "court":
      return <path d="M24 46 C20 16 80 16 76 46 C72 32 28 32 24 46 Z" fill={l.hair} />;
    case "foulard":
      return (
        <g>
          <path d="M20 48 C14 10 86 10 80 48 C74 30 26 30 20 48 Z" fill={l.accent} />
          <path d="M70 20 C88 14 92 30 82 36 C80 28 76 24 70 20 Z" fill={l.accent} />
          <path d="M28 30 h44" stroke="#fff" strokeOpacity=".4" strokeWidth="3" />
        </g>
      );
    case "chignon":
      return (
        <g fill={l.hair}>
          <circle cx="50" cy="12" r="11" />
          <path d="M24 46 C20 16 80 16 76 46 C72 30 28 30 24 46 Z" />
        </g>
      );
    case "rase":
      return <path d="M27 40 C28 22 72 22 73 40 C66 30 34 30 27 40 Z" fill={l.hair} opacity=".85" />;
  }
}

export function Avatar({ id, size = 64, className = "" }: { id: AvatarId; size?: number; className?: string }) {
  const l = AVATARS[id] ?? AVATARS.awa;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} role="img" aria-label={`Avatar ${l.name}`}>
      <circle cx="50" cy="50" r="50" fill={l.accent} opacity=".25" />
      <path d="M18 100 C18 76 82 76 82 100 Z" fill={l.shirt} />
      <rect x="43" y="64" width="14" height="12" rx="4" fill={l.skin} />
      {l.style === "afro" && <Hair l={l} />}
      <ellipse cx="50" cy="46" rx="24" ry="26" fill={l.skin} />
      <ellipse cx="26" cy="48" rx="4" ry="6" fill={l.skin} />
      <ellipse cx="74" cy="48" rx="4" ry="6" fill={l.skin} />
      {l.style !== "afro" && <Hair l={l} />}
      <circle cx="41" cy="48" r="3.2" fill="#140d0a" />
      <circle cx="59" cy="48" r="3.2" fill="#140d0a" />
      <circle cx="42" cy="47" r="1" fill="#fff" />
      <circle cx="60" cy="47" r="1" fill="#fff" />
      <path d="M42 58 Q50 65 58 58" stroke="#3b1d10" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <circle cx="35" cy="56" r="3.5" fill="#ff8a8a" opacity=".35" />
      <circle cx="65" cy="56" r="3.5" fill="#ff8a8a" opacity=".35" />
    </svg>
  );
}

/** LUMO, la petite lanterne-luciole qui accompagne la lecture. */
export function LumoMascot({ size = 80, className = "", talking = false }: { size?: number; className?: string; talking?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} role="img" aria-label="LUMO, ton compagnon de lecture">
      <circle cx="60" cy="64" r="48" fill="#ffd84a" opacity=".25" />
      <path d="M30 40 C14 22 18 8 34 14 C44 18 46 30 44 40 Z" fill="#cfe6ff" opacity=".9" />
      <path d="M90 40 C106 22 102 8 86 14 C76 18 74 30 76 40 Z" fill="#cfe6ff" opacity=".9" />
      <rect x="28" y="30" width="64" height="70" rx="32" fill="#6f48de" />
      <rect x="34" y="62" width="52" height="34" rx="17" fill="#ffd84a" />
      <circle cx="47" cy="50" r="7" fill="#fff" />
      <circle cx="73" cy="50" r="7" fill="#fff" />
      <circle cx="48" cy="51" r="3.5" fill="#1f1a2e" />
      <circle cx="74" cy="51" r="3.5" fill="#1f1a2e" />
      {talking ? <ellipse cx="60" cy="62" rx="6" ry="4" fill="#1f1a2e" /> : <path d="M53 61 Q60 67 67 61" stroke="#1f1a2e" strokeWidth="3" fill="none" strokeLinecap="round" />}
      <path d="M52 30 C50 20 56 14 60 10 C64 14 70 20 68 30" fill="#ff8a2b" />
      <path d="M44 80 h32 M48 87 h24" stroke="#f26a0f" strokeWidth="3" strokeLinecap="round" opacity=".6" />
    </svg>
  );
}
