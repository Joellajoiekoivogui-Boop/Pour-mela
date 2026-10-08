"use client";

import { useEffect, type RefObject } from "react";
import { director, type SceneKey } from "@/lib/director";

/**
 * Change la scène WebGL quand la section traverse le milieu de l'écran.
 * `anchor` : élément que la forme doit suivre pendant le défilement.
 */
export function useSceneOnView(
  ref: RefObject<HTMLElement | null>,
  scene: SceneKey,
  anchor?: RefObject<HTMLElement | null>,
  onEnter?: () => void,
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          director.setScene(scene, anchor?.current ?? null);
          onEnter?.();
        }
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, scene, anchor, onEnter]);
}
