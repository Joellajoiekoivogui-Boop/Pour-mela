"use client";

import Lenis from "lenis";
import { MotionConfig } from "motion/react";
import { useEffect, useState } from "react";
import { joel } from "@/config/joel";
import { QualityContext } from "@/hooks/useQuality";
import { audio } from "@/lib/audio";
import { detectQuality, SERVER_QUALITY, type Quality } from "@/lib/quality";
import { initStage, stage } from "@/lib/stage";
import { Celebration } from "./Celebration";
import { EasterEggs } from "./EasterEggs";
import { Footer } from "./Footer";
import { FxLayer } from "./fx/FxLayer";
import { ParticleBackground } from "./fx/ParticleBackground";
import { Ambitions } from "./sections/Ambitions";
import { BirthdayMessage } from "./sections/BirthdayMessage";
import { Countdown } from "./sections/Countdown";
import { Finale } from "./sections/Finale";
import { Gallery } from "./sections/Gallery";
import { Hero } from "./sections/Hero";
import { Letter } from "./sections/Letter";
import { Memories } from "./sections/Memories";
import { NewYear } from "./sections/NewYear";
import { Timeline } from "./sections/Timeline";
import { Cursor } from "./ui/Cursor";
import { Nav } from "./ui/Nav";
import { ProgressRail } from "./ui/ProgressRail";
import { Toasts } from "./ui/Toasts";

/** L'expérience entière : huit chapitres, un ciel de particules, des effets. */
export function Experience() {
  const [quality, setQuality] = useState<Quality>(SERVER_QUALITY);
  const [ready, setReady] = useState(false);
  const [chapter, setChapter] = useState("accueil");

  // Capacités de l'appareil, souris, défilement.
  useEffect(() => {
    const q = detectQuality();
    stage.quality = q;
    audio.file = joel.musique.fichier;
    const stop = initStage(q);
    document.documentElement.dataset.tier = q.tier;
    if (q.reducedMotion) document.documentElement.dataset.reduced = "";
    const timer = window.setTimeout(() => {
      setQuality(q);
      setReady(true);
    }, 0);
    return () => {
      stop();
      window.clearTimeout(timer);
    };
  }, []);

  // Défilement doux à la souris (jamais au doigt : le défilement natif y est meilleur).
  useEffect(() => {
    if (!ready || quality.touch || quality.reducedMotion) return;
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, [ready, quality.touch, quality.reducedMotion]);

  // Le chapitre au centre de l'écran donne sa couleur au ciel.
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-chapter]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = (entry.target as HTMLElement).dataset.chapter!;
          stage.chapter = id;
          document.documentElement.dataset.chapter = id;
          setChapter(id);
        }
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <QualityContext.Provider value={quality}>
      <MotionConfig reducedMotion={quality.reducedMotion ? "always" : "never"}>
        <div aria-hidden className="atmosphere">
          <span className="halo halo-a" />
          <span className="halo halo-b" />
          <span className="halo halo-c" />
        </div>
        {ready && <ParticleBackground />}
        <div aria-hidden className="grain" />
        <a href="#compte-a-rebours" className="skip-link">
          Aller au contenu
        </a>
        <Nav />
        <ProgressRail current={chapter} />
        <main className="relative z-10">
          <Hero />
          <Countdown />
          <NewYear />
          <Timeline />
          <Ambitions />
          <Gallery />
          <Memories />
          <Letter />
          <BirthdayMessage />
          <Finale />
        </main>
        <Footer />
        {ready && <FxLayer />}
        {ready && <Cursor />}
        <Celebration />
        <Toasts />
        <EasterEggs />
      </MotionConfig>
    </QualityContext.Provider>
  );
}
