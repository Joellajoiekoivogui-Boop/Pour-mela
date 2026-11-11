import Link from "next/link";
import { Logo } from "./logo";
import { Avatar } from "./ui";
import { logout } from "@/app/actions/auth";
import type { CurrentUser } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/env";

type Item = { href: string; label: string; badge?: number };

export function AppShell({ user, counts, children }: { user: CurrentUser; counts: { notifications: number; messages: number }; children: React.ReactNode }) {
  const items: Item[] = [
    { href: "/accueil", label: "Accueil" },
    ...(user.role === "MENTEE" ? [{ href: "/trouver", label: "Trouver" }] : []),
    ...(user.role === "MENTOR" ? [{ href: "/mentores", label: "Mes mentorés" }] : []),
    { href: "/seances", label: "Séances" },
    { href: "/objectifs", label: "Objectifs" },
    { href: "/messages", label: "Messages", badge: counts.messages },
    { href: "/ressources", label: "Ressources" },
    { href: "/opportunites", label: "Opportunités" },
    { href: "/programmes", label: "Programmes" },
    ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Coordination" }] : []),
  ];
  return (
    <div className="min-h-dvh">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">Aller au contenu</a>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Logo href="/accueil" />
          {DEMO_MODE && user.isDemo && <span className="hidden rounded-full bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn sm:inline">Compte de démonstration</span>}
          <div className="ml-auto flex items-center gap-1">
            <Link href="/notifications" className="relative rounded-lg px-2.5 py-2 text-sm font-medium text-ink-2 hover:bg-surface-2" aria-label={`Notifications${counts.notifications ? ` (${counts.notifications} non lues)` : ""}`}>
              <span aria-hidden="true">🔔</span>
              {counts.notifications > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">{counts.notifications}</span>}
            </Link>
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2">
                <Avatar name={user.name} size={30} />
                <span className="hidden text-sm font-medium sm:inline">{user.name.split(" ")[0]}</span>
              </summary>
              <div className="absolute right-0 mt-2 grid w-56 gap-1 rounded-xl border border-line bg-surface p-2 text-sm shadow-xl">
                <Link href="/profil" className="rounded-lg px-3 py-2 hover:bg-surface-2">Mon profil</Link>
                <Link href="/profil/cv" className="rounded-lg px-3 py-2 hover:bg-surface-2">Mon CV</Link>
                {user.role === "MENTOR" && <Link href={`/mentors/${user.id}`} className="rounded-lg px-3 py-2 hover:bg-surface-2">Mon profil public</Link>}
                <form action={logout}><button className="w-full rounded-lg px-3 py-2 text-left text-bad hover:bg-bad-soft">Se déconnecter</button></form>
              </div>
            </details>
          </div>
        </div>
        <nav aria-label="Navigation de l'espace" className="mx-auto max-w-6xl overflow-x-auto px-2">
          <ul className="flex gap-1 whitespace-nowrap pb-2 text-sm">
            {items.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-ink-2 hover:bg-surface-2 hover:text-ink">
                  {i.label}
                  {!!i.badge && <span className="rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">{i.badge}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="contenu" className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
