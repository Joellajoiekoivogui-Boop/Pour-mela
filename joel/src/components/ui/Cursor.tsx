"use client";

import { useEffect, useRef } from "react";
import { stage } from "@/lib/stage";

const INTERACTIVE = "a, button, [role='button'], [data-cursor], input, label";
const TRAIL = 6;

/**
 * Curseur personnalisé (ordinateur seulement) : un point, un cercle qui le
 * suit avec un peu de retard, une petite traînée lumineuse. Le cercle
 * grandit et s'illumine au-dessus des éléments interactifs.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const trail = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine || stage.quality.reducedMotion) return;
    document.documentElement.classList.add("cursor-custom");
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...pos };
    const points = Array.from({ length: TRAIL }, () => ({ ...pos }));
    let hover = 0;
    let target = 0;
    let down = 0;
    let visible = false;
    let raf = 0;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pos.x = event.clientX;
      pos.y = event.clientY;
      if (!visible) {
        visible = true;
        ringPos.x = pos.x;
        ringPos.y = pos.y;
        points.forEach((p) => Object.assign(p, pos));
        document.documentElement.classList.add("cursor-visible");
      }
      const el = (event.target as Element | null)?.closest?.(INTERACTIVE);
      target = el ? 1 : 0;
    };
    const onLeave = () => {
      visible = false;
      document.documentElement.classList.remove("cursor-visible");
    };
    const onDown = () => (down = 1);
    const onUp = () => (down = 0);

    const frame = () => {
      raf = requestAnimationFrame(frame);
      hover += (target - hover) * 0.18;
      ringPos.x += (pos.x - ringPos.x) * 0.18;
      ringPos.y += (pos.y - ringPos.y) * 0.18;
      const scale = 1 + hover * 1.4 - down * 0.25;
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${1 - hover * 0.6})`;
      if (ring.current) {
        ring.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) scale(${scale})`;
        ring.current.style.setProperty("--hover", hover.toFixed(3));
      }
      let prev = pos;
      points.forEach((p, i) => {
        p.x += (prev.x - p.x) * 0.45;
        p.y += (prev.y - p.y) * 0.45;
        prev = p;
        const el = trail.current[i];
        if (el) el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${1 - i / TRAIL})`;
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("cursor-custom", "cursor-visible");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div aria-hidden className="cursor-layer">
      {Array.from({ length: TRAIL }, (_, i) => (
        <div key={i} ref={(el) => void (trail.current[i] = el)} className="cursor-trail" style={{ "--o": 0.35 - i * 0.05 } as React.CSSProperties} />
      ))}
      <div ref={ring} className="cursor-ring" />
      <div ref={dot} className="cursor-dot" />
    </div>
  );
}
