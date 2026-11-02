"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Sparkles, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { useProgress } from "@/components/progress/ProgressProvider";
import { cx } from "@/lib/utils/colors";
import { NAV } from "./nav";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { state, summary, ready } = useProgress();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-encre/5 bg-creme/90 backdrop-blur">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Aller au contenu
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cx(
                    "rounded-xl px-3 py-2 text-sm font-bold transition",
                    isActive(item.href) ? "bg-orange-100 text-orange-700" : "text-encre-doux hover:bg-encre/5 hover:text-encre",
                  )}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-2xl bg-white py-1 pl-1 pr-3 text-sm font-extrabold shadow-carte ring-1 ring-encre/5 hover:ring-orange-300"
            aria-label={`Mon espace : ${ready ? summary.xp : 0} points d'expérience`}
          >
            {state.profile ? <Avatar id={state.profile.avatar} size={32} /> : <span className="grid size-8 place-items-center rounded-full bg-jaune-100"><Sparkles className="size-4 text-jaune-600" aria-hidden /></span>}
            <span className="tabular-nums">{ready ? summary.xp : 0} XP</span>
          </Link>
          <button
            className="grid size-11 place-items-center rounded-xl hover:bg-encre/5 lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="menu-mobile" aria-label="Menu" className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-creme px-4 pb-10 lg:hidden">
          <ul className="grid gap-2 pt-4">
            {[...NAV, { href: "/dashboard", label: "Mon espace" }, { href: "/passeport", label: "Mon passeport africain" }, { href: "/parents", label: "Parents et enseignants" }].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cx("block rounded-2xl px-5 py-4 text-lg font-extrabold", isActive(item.href) ? "bg-orange-100 text-orange-700" : "bg-white shadow-carte")}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
