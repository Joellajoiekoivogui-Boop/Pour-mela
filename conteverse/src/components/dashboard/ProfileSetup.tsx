"use client";

import { useState } from "react";
import { Avatar, AVATAR_IDS, AVATARS } from "@/components/ui/Avatar";
import { useProgress } from "@/components/progress/ProgressProvider";
import type { AgeGroup, AvatarId, LearnerProfile } from "@/lib/progress/types";
import { cx } from "@/lib/utils/colors";

/** Pseudonyme : lettres, espaces et tirets uniquement (pas de chiffres → pas de numéros). */
export const cleanPseudo = (s: string) => s.replace(/[^\p{L} '-]/gu, "").replace(/\s+/g, " ").slice(0, 20);

export function ProfileSetup({ initial, onDone }: { initial?: LearnerProfile | null; onDone?: () => void }) {
  const { dispatch } = useProgress();
  const [pseudo, setPseudo] = useState(initial?.pseudo ?? "");
  const [avatar, setAvatar] = useState<AvatarId>(initial?.avatar ?? "awa");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(initial?.ageGroup ?? "7-9");
  const valid = cleanPseudo(pseudo).trim().length >= 2;

  return (
    <form
      className="rounded-[2rem] bg-white p-6 shadow-carte ring-1 ring-encre/5 sm:p-10"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        dispatch({ type: "setProfile", profile: { pseudo: cleanPseudo(pseudo).trim(), avatar, ageGroup } });
        onDone?.();
      }}
    >
      <h2 className="text-2xl font-black">{initial ? "Modifier mon profil" : "Crée ton profil d'explorateur"}</h2>
      <p className="mt-1 text-encre-doux">Choisis un pseudonyme (pas ton vrai nom complet !) et un avatar.</p>

      <label className="mt-6 block">
        <span className="font-extrabold">Ton pseudonyme</span>
        <input value={pseudo} onChange={(e) => setPseudo(cleanPseudo(e.target.value))} placeholder="Ex. : Petit Baobab" className="mt-2 min-h-12 w-full rounded-2xl bg-creme px-4 text-lg font-bold ring-1 ring-encre/10" maxLength={20} required />
        <span className="mt-1 block text-xs text-encre-doux">Lettres uniquement, 20 caractères maximum.</span>
      </label>

      <fieldset className="mt-6">
        <legend className="font-extrabold">Ton avatar</legend>
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {AVATAR_IDS.map((id) => (
            <button type="button" key={id} onClick={() => setAvatar(id)} aria-pressed={avatar === id} className={cx("grid place-items-center rounded-2xl p-2 ring-2 transition", avatar === id ? "bg-orange-50 ring-orange-400" : "ring-encre/5 hover:ring-orange-200")}>
              <Avatar id={id} size={64} />
              <span className="mt-1 text-xs font-bold">{AVATARS[id].name}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="font-extrabold">Ton âge</legend>
        <div className="mt-3 flex gap-3">
          {(["7-9", "10-12"] as const).map((g) => (
            <button type="button" key={g} onClick={() => setAgeGroup(g)} aria-pressed={ageGroup === g} className={cx("min-h-12 rounded-2xl px-5 font-extrabold ring-2", ageGroup === g ? "bg-violet-500 text-white ring-violet-500" : "ring-encre/10")}>
              {g} ans
            </button>
          ))}
        </div>
      </fieldset>

      <button type="submit" disabled={!valid} className="mt-8 min-h-12 rounded-2xl bg-orange-500 px-8 py-3 text-lg font-extrabold text-white shadow-[0_4px_0_0_var(--color-orange-700)] hover:bg-orange-600 disabled:opacity-40">
        {initial ? "Enregistrer" : "C'est parti !"}
      </button>
    </form>
  );
}
