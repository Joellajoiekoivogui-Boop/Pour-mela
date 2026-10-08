"use client";

import { useEffect } from "react";
import { joel } from "@/config/joel";
import { audio } from "@/lib/audio";
import { burst, confetti, findSecret, PARTY_COLORS, toast } from "@/lib/fx";
import { stage } from "@/lib/stage";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const WORD = "joel";

/**
 * Les surprises cachées (le logo et l'étoile vivent dans leurs composants) :
 *  - dessiner un grand cercle rapide avec la souris : explosion de particules ;
 *  - le code Konami (↑ ↑ ↓ ↓ ← → ← → B A) ou taper « joel » : mode secret.
 */
export function EasterEggs() {
  useEffect(() => {
    // --- Le cercle ---------------------------------------------------
    const trail: { x: number; y: number; t: number }[] = [];
    let cooldown = 0;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const now = performance.now();
      trail.push({ x: event.clientX, y: event.clientY, t: now });
      while (trail.length && now - trail[0].t > 1100) trail.shift();
      if (trail.length < 24 || now < cooldown) return;
      let cx = 0;
      let cy = 0;
      for (const p of trail) {
        cx += p.x;
        cy += p.y;
      }
      cx /= trail.length;
      cy /= trail.length;
      let turn = 0;
      let radius = 0;
      let prev = Math.atan2(trail[0].y - cy, trail[0].x - cx);
      for (const p of trail) {
        const a = Math.atan2(p.y - cy, p.x - cx);
        let d = a - prev;
        if (d > Math.PI) d -= Math.PI * 2;
        else if (d < -Math.PI) d += Math.PI * 2;
        turn += d;
        prev = a;
        radius += Math.hypot(p.x - cx, p.y - cy);
      }
      radius /= trail.length;
      // Un tour complet, assez grand et assez rond.
      if (Math.abs(turn) > Math.PI * 1.9 && radius > 60) {
        const spread = trail.reduce((s, p) => s + Math.abs(Math.hypot(p.x - cx, p.y - cy) - radius), 0) / trail.length;
        if (spread < radius * 0.35) {
          cooldown = now + 2500;
          trail.length = 0;
          burst({ x: cx, y: cy, count: 220, power: 11, colors: PARTY_COLORS });
          burst({ x: cx, y: cy, count: 60, power: 4, rise: true });
          audio.fanfare();
          const n = findSecret("geste");
          toast(`${joel.secrets.geste} · ${n}/4`, "secret");
        }
      }
    };

    // --- Le clavier --------------------------------------------------
    let konami = 0;
    let typed = "";
    const activate = () => {
      stage.secretMode = !stage.secretMode;
      document.documentElement.toggleAttribute("data-secret", stage.secretMode);
      if (stage.secretMode) {
        confetti({ count: 140, colors: ["#f0abfc", "#fde68a", "#a78bfa", "#ffffff"] });
        audio.fanfare();
        const n = findSecret("clavier");
        toast(`${joel.secrets.clavier} · ${n}/4`, "secret");
      } else toast("Mode secret désactivé.");
    };
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea")) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      konami = key === KONAMI[konami] ? konami + 1 : key === KONAMI[0] ? 1 : 0;
      if (konami === KONAMI.length) {
        konami = 0;
        activate();
      }
      if (key.length === 1) {
        typed = (typed + key.normalize("NFD").replace(/[̀-ͯ]/g, "")).slice(-WORD.length);
        if (typed === WORD) {
          typed = "";
          activate();
        }
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  return null;
}
