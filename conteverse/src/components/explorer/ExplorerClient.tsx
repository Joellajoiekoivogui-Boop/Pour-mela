"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { AfricaMap } from "./AfricaMap";
import { territoryByCode } from "@/data/africa";

export function ExplorerClient() {
  const [soon, setSoon] = useState<string | null>(null);
  const t = soon ? territoryByCode[soon] : null;
  return (
    <div className="relative">
      <AfricaMap onSelectSoon={setSoon} />
      {t && (
        <div role="dialog" aria-live="polite" aria-label={t.name} className="absolute left-3 right-3 top-3 z-[500] rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-encre/10 sm:left-auto sm:w-80">
          <button onClick={() => setSoon(null)} className="absolute right-2 top-2 rounded-full p-2 hover:bg-encre/5" aria-label="Fermer">
            <X className="size-4" />
          </button>
          <h3 className="pr-8 text-xl font-black">{t.name}</h3>
          {t.disputed ? (
            <p className="mt-2 text-sm text-encre-doux">Le statut de ce territoire n&apos;est pas réglé : les Nations unies le considèrent comme un territoire non autonome. Il n&apos;a pas de fiche pays.</p>
          ) : (
            <>
              {t.capital && <p className="mt-1 text-sm font-bold text-encre-doux">Capitale : {t.capital}</p>}
              <p className="mt-3 text-sm text-encre-doux">
                La fiche de ce pays est en préparation : notre équipe rassemble des informations vérifiées avant de la publier.
              </p>
              <Link href="/explorer/gn" className="mt-4 inline-block text-sm font-extrabold text-orange-700 hover:underline">
                En attendant, découvre la Guinée →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
