"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { signOutAction } from "@/lib/actions/auth";
import { ROLE_LABELS } from "@/lib/labels";
import { cn, fullName } from "@/lib/utils";
import type { Profile } from "@/types/db";
import { Logo } from "./logo";
import { navForRole, type NavItem } from "./nav-config";
import { NotificationBell } from "./notification-bell";

type Person = Pick<Profile, "id" | "role" | "first_name" | "last_name" | "avatar_url" | "is_demo">;

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function Sidebar({ person, onNavigate }: { person: Person; onNavigate?: () => void }) {
  const pathname = usePathname();
  const groups = navForRole(person.role);
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Logo href={groups[0]?.items[0]?.href ?? "/"} />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Navigation de l'espace">
        {groups.map((group, i) => (
          <div key={group.title ?? i}>
            {group.title && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.title}</p>}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        active ? "bg-primary-soft font-medium text-primary" : "text-slate-600 hover:bg-subtle hover:text-foreground",
                      )}
                    >
                      <item.icon className="size-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar person={person} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{fullName(person)}</p>
            <p className="truncate text-xs text-muted">{ROLE_LABELS[person.role]}{person.is_demo ? " · démo" : ""}</p>
          </div>
          <form action={signOutAction}>
            <button type="submit" className="inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-subtle hover:text-danger" aria-label="Se déconnecter" title="Se déconnecter">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ person, unreadCount, children }: { person: Person; unreadCount: number; children: React.ReactNode }) {
  const pathname = usePathname();
  // Le menu mobile n'est ouvert que pour la page sur laquelle on l'a ouvert :
  // il se referme donc tout seul à chaque navigation.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);
  const notificationsHref = person.role === "mentor" ? "/mentor/notifications" : person.role === "mentee" ? "/mentore/notifications" : null;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-surface lg:block">
        <Sidebar person={person} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" aria-label="Fermer le menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-fade-in bg-surface shadow-xl">
            <button type="button" className="absolute right-3 top-4 inline-flex size-9 items-center justify-center rounded-md hover:bg-subtle" onClick={() => setOpen(false)} aria-label="Fermer le menu">
              <X className="size-5" />
            </button>
            <Sidebar person={person} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-white/85 px-4 backdrop-blur-md sm:px-6">
          <button type="button" className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-subtle lg:hidden" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
            <Menu className="size-5" />
          </button>
          <div className="lg:hidden"><Logo href={navForRole(person.role)[0]?.items[0]?.href ?? "/"} className="[&>span]:hidden sm:[&>span]:inline" /></div>
          <div className="ml-auto flex items-center gap-2">
            {person.is_demo && <Badge tone="warning">Compte de démonstration</Badge>}
            {notificationsHref && <NotificationBell userId={person.id} initialCount={unreadCount} href={notificationsHref} />}
          </div>
        </header>
        <main id="contenu" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
