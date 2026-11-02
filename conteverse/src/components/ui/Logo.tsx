import Link from "next/link";

/** Logo typographique : le « O » est un soleil-globe, les lettres alternent la palette. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#f26a0f" />
      <path d="M24 2a22 22 0 0 1 0 44c-6-6-9-13.5-9-22S18 8 24 2Z" fill="#ff8a2b" />
      <path d="M8 30c6-4 12-4 16 0s10 4 16 0v6a22 22 0 0 1-32 0Z" fill="#189557" />
      <circle cx="31" cy="16" r="5" fill="#ffd84a" />
      <path d="M14 20c2-3 5-4 8-3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".7" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2" aria-label="CONTEVERSE, retour à l'accueil">
      <LogoMark />
      {!compact && (
        <span className="text-xl font-black tracking-tight sm:text-2xl">
          <span className="text-orange-600">CONTE</span>
          <span className="text-violet-600">VERSE</span>
        </span>
      )}
    </Link>
  );
}
