import Link from "next/link";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#1b2533" />
      <circle cx="12" cy="11" r="4" fill="#f08c35" />
      <circle cx="21.5" cy="14" r="3" fill="#ffffff" />
      <path d="M5 26c1.2-5 4-7.5 7-7.5s5.8 2.5 7 7.5" fill="#f08c35" />
      <path d="M16.5 26c.8-3.6 2.8-5.4 5-5.4s4.2 1.8 5 5.4" fill="#ffffff" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-bold tracking-tight text-ink" aria-label="MonMentor, accueil">
      <LogoMark />
      <span className="text-lg">
        Mon<span className="text-accent">Mentor</span>
      </span>
    </Link>
  );
}
