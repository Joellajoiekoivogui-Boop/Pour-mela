"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

const LINKS = [
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/mentors", label: "Mentors" },
  { href: "/domaines", label: "Domaines" },
  { href: "/devenir-mentor", label: "Devenir mentor" },
  { href: "/a-propos", label: "À propos" },
];

export function PublicNavbar({ isSignedIn }: { isSignedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6" aria-label="Navigation principale">
        <Logo />
        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={cn("rounded-md px-3 py-2 text-sm text-slate-600 transition-colors hover:text-foreground", pathname.startsWith(l.href) && "font-medium text-foreground")}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-2 lg:flex">
          {isSignedIn ? (
            <ButtonLink href="/espace" size="sm">Mon espace</ButtonLink>
          ) : (
            <>
              <ButtonLink href="/connexion" variant="ghost" size="sm">Connexion</ButtonLink>
              <ButtonLink href="/inscription" size="sm">Créer un compte</ButtonLink>
            </>
          )}
        </div>
        <button type="button" className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-subtle lg:hidden" aria-expanded={open} aria-controls="menu-mobile" aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} onClick={() => setOpen((v) => !v)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>
      {open && (
        <div id="menu-mobile" className="border-t border-border bg-white px-4 pb-5 pt-2 lg:hidden">
          <ul className="flex flex-col">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className="block rounded-md px-2 py-3 text-[15px] text-slate-700 hover:bg-subtle">{l.label}</Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {isSignedIn ? (
              <ButtonLink href="/espace" className="col-span-2" onClick={() => setOpen(false)}>Mon espace</ButtonLink>
            ) : (
              <>
                <ButtonLink href="/connexion" variant="secondary" onClick={() => setOpen(false)}>Connexion</ButtonLink>
                <ButtonLink href="/inscription" onClick={() => setOpen(false)}>Créer un compte</ButtonLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
