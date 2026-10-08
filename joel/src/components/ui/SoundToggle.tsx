"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useSyncExternalStore } from "react";
import { audio } from "@/lib/audio";

export function useAudioOn() {
  return useSyncExternalStore(
    (cb) => audio.subscribe(cb),
    () => audio.started && audio.enabled,
    () => false,
  );
}

/** Bouton 🔇 / 🔊 : la musique ne démarre jamais sans un clic. */
export function SoundToggle() {
  const on = useAudioOn();
  return (
    <button
      type="button"
      onClick={() => audio.toggle()}
      aria-pressed={on}
      aria-label={on ? "Couper la musique" : "Activer la musique"}
      className="relative grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur-md transition hover:border-violet-300/60 hover:bg-white/10"
    >
      {on ? <Volume2 size={18} /> : <VolumeX size={18} />}
      {on && (
        <span aria-hidden className="absolute -bottom-1 flex h-2 items-end gap-[2px]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="eq-bar w-[2px] rounded-full bg-violet-300" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </span>
      )}
    </button>
  );
}
