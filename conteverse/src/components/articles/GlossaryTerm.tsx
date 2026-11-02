"use client";

import { useId, useState } from "react";

/** Mot important cliquable : sa définition s'affiche sous forme de bulle. */
export function GlossaryTerm({ word, definition, children }: { word: string; definition: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        className="rounded bg-jaune-100 px-1 font-bold text-encre underline decoration-jaune-400 decoration-dotted decoration-2 underline-offset-4 hover:bg-jaune-300"
      >
        {children}
      </button>
      {open && (
        <span id={id} role="tooltip" className="absolute left-0 top-full z-20 mt-2 block w-64 rounded-2xl bg-encre p-3 text-sm font-semibold leading-snug text-white shadow-xl">
          <strong className="text-jaune-300">{word} :</strong> {definition}
        </span>
      )}
    </span>
  );
}
