import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <defs>
        <linearGradient id="tc-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#tc-g)" />
      {/* Deux nœuds reliés : le mentor et le talent */}
      <circle cx="11" cy="12" r="3.2" fill="#fff" />
      <circle cx="21" cy="20" r="3.2" fill="#fff" fillOpacity="0.85" />
      <path d="M13.3 14.2 18.7 17.8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M21 9.5v4M19 11.5h4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.9" />
    </svg>
  );
}

export function Logo({ className, light = false, href = "/" }: { className?: string; light?: boolean; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 font-semibold tracking-tight", className)} aria-label="TALENTS CONNECT — accueil">
      <LogoMark />
      <span className={cn("text-[15px]", light ? "text-white" : "text-navy")}>
        TALENTS <span className={light ? "text-blue-300" : "text-primary"}>CONNECT</span>
      </span>
    </Link>
  );
}
