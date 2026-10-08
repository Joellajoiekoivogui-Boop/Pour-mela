"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { joel } from "@/config/joel";
import { foundSecrets, onFx } from "@/lib/fx";
import { scrollToChapter } from "./ui/Nav";

/** Le pied de page : retour en haut, et le compteur des secrets trouvés. */
export function Footer() {
  const [found, setFound] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(() => setFound(foundSecrets().length), 0);
    const off = onFx((event) => {
      if (event.type === "secret") setFound(foundSecrets().length);
    });
    return () => {
      window.clearTimeout(timer);
      off();
    };
  }, []);

  return (
    <footer className="relative z-10 border-t border-white/10 px-6 pb-[calc(var(--safe-bottom)+32px)] pt-12 sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
        <p className="label text-white/50">{joel.pied}</p>
        <p className="label text-white/35" title="Logo, geste, clavier, étoile…">
          Secrets trouvés : {found}/4 {found === 4 ? "🏆" : "🤫"}
        </p>
        <button type="button" onClick={() => scrollToChapter("accueil")} className="label flex items-center gap-2 text-white/60 transition hover:text-white">
          Revenir au début <ArrowUp size={14} />
        </button>
      </div>
    </footer>
  );
}
