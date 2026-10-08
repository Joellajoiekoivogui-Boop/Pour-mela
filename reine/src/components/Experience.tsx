"use client";

import dynamic from "next/dynamic";
import { animate, MotionConfig } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { reine } from "@/config/reine";
import { useDirector } from "@/hooks/useDirector";
import { enableTilt, vibrate } from "@/lib/device";
import { director } from "@/lib/director";
import { music } from "@/lib/music";
import { GlBoundary } from "./gl/GlBoundary";
import { Intro } from "./intro/Intro";
import { Aurora, Overlays, StaticSky } from "./ui/Atmosphere";
import { Cursor } from "./ui/Cursor";
import { ProgressRail } from "./ui/ProgressRail";
import { SoundToggle } from "./ui/SoundToggle";

// Chargés à part : Three.js et les chapitres ne retardent pas l'introduction.
const Stage = dynamic(() => import("./gl/Stage"), { ssr: false });
const loadChapters = () => import("./Chapters");
const Chapters = dynamic(loadChapters, { ssr: false });

type Phase = "intro" | "entering" | "main";

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/**
 * Le chef d'orchestre : introduction, saut vers le royaume, chapitres.
 * Il relaie aussi le pointeur, le défilement et l'inclinaison vers la scène.
 */
export function Experience() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [introKey, setIntroKey] = useState(0);
  const flash = useRef<HTMLDivElement>(null);
  const ready = useDirector((d) => d.ready);
  const glActive = useDirector((d) => d.glActive);
  const quality = useDirector((d) => d.quality);
  const useWebGL = ready && quality.webgl && !quality.reducedMotion;

  useEffect(() => {
    director.init();
    music.file = reine.musique.fichier;
    music.volume = reine.musique.volume;
    void loadChapters();
  }, []);

  usePointerField();
  useScrollVelocity();

  // Pas de défilement pendant l'introduction.
  useEffect(() => {
    if (phase === "main") delete document.body.dataset.locked;
    else document.body.dataset.locked = "";
  }, [phase]);

  const enter = useCallback(async () => {
    if (phase !== "intro") return;
    setPhase("entering");
    music.start();
    music.whoosh();
    void enableTilt();
    vibrate([15, 60, 30]);

    // Le prénom explose, les étoiles s'étirent : vitesse lumière.
    director.explode(1.6);
    director.warp = 1;
    director.setScene("sky");
    if (!director.glActive || director.quality.reducedMotion) await wait(300);
    else await wait(1150);

    if (flash.current) await animate(flash.current, { opacity: [0, 1] }, { duration: 0.45, ease: "easeIn" });
    window.scrollTo(0, 0);
    setPhase("main");
    director.warp = 0;
    music.setIntensity(1);
    await wait(120);
    if (flash.current) animate(flash.current, { opacity: 0 }, { duration: 1.3, ease: "easeOut" });
  }, [phase]);

  const replay = useCallback(async () => {
    if (flash.current) await animate(flash.current, { opacity: [0, 1] }, { duration: 0.6, ease: "easeIn" });
    window.scrollTo(0, 0);
    music.setIntensity(0);
    director.setScene("void");
    setIntroKey((k) => k + 1);
    setPhase("intro");
    await wait(200);
    if (flash.current) animate(flash.current, { opacity: 0 }, { duration: 1.2, ease: "easeOut" });
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <Aurora />
      {useWebGL ? (
        <GlBoundary>
          <Stage />
        </GlBoundary>
      ) : null}
      {!glActive ? <StaticSky /> : null}
      <Overlays />

      <main className="relative z-10 overflow-x-clip">
        {phase !== "main" ? <Intro key={introKey} onEnter={enter} leaving={phase === "entering"} /> : null}
        {phase === "main" ? <Chapters onReplay={replay} /> : null}
      </main>

      {phase === "main" ? <ProgressRail /> : null}
      <SoundToggle />
      <Cursor />
      <div
        ref={flash}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60] opacity-0"
        style={{
          background: "radial-gradient(circle at 50% 50%, #fffaf0 0%, #fbe7c0 28%, #e9c46a 52%, rgb(255 111 154 / 0.85) 75%, #2a0d22 100%)",
        }}
      />
    </MotionConfig>
  );
}

/** Le pointeur (souris ou doigt) : position, vitesse, traînée de lumière. */
function usePointerField() {
  useEffect(() => {
    let carry = 0;
    const update = (x: number, y: number) => {
      const p = director.pointer;
      const now = performance.now();
      const dt = Math.max(8, now - p.lastMove) / 1000;
      const vx = Math.max(-6000, Math.min(6000, (x - p.x) / dt));
      const vy = Math.max(-6000, Math.min(6000, (y - p.y) / dt));
      const fresh = now - p.lastMove > 200;
      p.vx = fresh ? 0 : p.vx * 0.5 + vx * 0.5;
      p.vy = fresh ? 0 : p.vy * 0.5 + vy * 0.5;
      const distance = fresh ? 0 : Math.hypot(x - p.x, y - p.y);
      p.x = x;
      p.y = y;
      p.nx = (x / window.innerWidth) * 2 - 1;
      p.ny = -(y / window.innerHeight) * 2 + 1;
      p.active = true;
      p.lastMove = now;
      return distance;
    };

    const move = (event: PointerEvent) => {
      const distance = update(event.clientX, event.clientY);
      if (event.pointerType !== "mouse" || director.quality.reducedMotion) return;
      carry += distance;
      let emitted = 0;
      while (carry > 16 && emitted < 3) {
        director.emit({ kind: "trail", x: event.clientX, y: event.clientY, vx: director.pointer.vx, vy: director.pointer.vy, amount: 0.6 });
        carry -= 16;
        emitted++;
      }
      if (carry > 16) carry = 0;
    };

    // Le doigt continue d'agiter les étoiles pendant qu'il fait défiler.
    const touchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) update(touch.clientX, touch.clientY);
    };

    const down = (event: PointerEvent) => {
      update(event.clientX, event.clientY);
      const target = event.target as Element | null;
      if (target?.closest?.("button, a, input, [data-pad], [data-no-burst]")) return;
      director.emit({ kind: "hearts", x: event.clientX, y: event.clientY, amount: 0.55 });
      music.twinkle(0.7);
    };

    const up = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") director.pointer.active = false;
    };
    const leave = () => {
      director.pointer.active = false;
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointercancel", up, { passive: true });
    window.addEventListener("touchmove", touchMove, { passive: true });
    window.addEventListener("touchend", leave, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("touchend", leave);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);
}

/** La vitesse de défilement fait voyager les étoiles vers l'avant. */
function useScrollVelocity() {
  useEffect(() => {
    let lastY = window.scrollY;
    let lastTime = performance.now();
    const onScroll = () => {
      const now = performance.now();
      const dt = Math.max(8, now - lastTime) / 1000;
      const velocity = (window.scrollY - lastY) / dt;
      director.scrollVelocity = director.scrollVelocity * 0.6 + velocity * 0.4;
      lastY = window.scrollY;
      lastTime = now;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}
