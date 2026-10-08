"use client";

import { Bot, Globe2, Lightbulb, Rocket } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { CHAPITRES, joel, type IconeAmbition } from "@/config/joel";
import { audio } from "@/lib/audio";
import { burst } from "@/lib/fx";
import { stage } from "@/lib/stage";
import { ChapterLabel } from "../ui/ChapterLabel";
import { SplitText } from "../ui/SplitText";

const ICONS: Record<IconeAmbition, typeof Rocket> = { fusee: Rocket, robot: Bot, globe: Globe2, ampoule: Lightbulb };

/** Une carte qui s'incline vers la souris, avec un projecteur qui la suit. */
function Card({ card, index }: { card: (typeof joel.ambitions.cartes)[number]; index: number }) {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [10, -10]), { stiffness: 180, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-12, 12]), { stiffness: 180, damping: 18 });
  const Icon = ICONS[card.icone];

  return (
    <motion.article
      className="ambition-card group relative"
      initial={{ opacity: 0, y: 70, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        data-cursor
        className="glass relative h-full overflow-hidden rounded-[28px] p-7 sm:p-9"
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        onPointerMove={(event) => {
          if (stage.quality.reducedMotion) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          mx.set(x);
          my.set(y);
          event.currentTarget.style.setProperty("--mx", `${x * 100}%`);
          event.currentTarget.style.setProperty("--my", `${y * 100}%`);
        }}
        onPointerEnter={() => audio.chime(index * 2 + 1, 0.35)}
        onPointerLeave={() => {
          mx.set(0.5);
          my.set(0.5);
        }}
        onClick={(event) => burst({ x: event.clientX, y: event.clientY, count: 40, power: 5 })}
      >
        <span aria-hidden className="card-spotlight" />
        <div className="relative flex items-start justify-between" style={{ transform: "translateZ(40px)" }}>
          <span className="grid h-14 w-14 place-items-center rounded-2xl border border-violet-300/30 bg-violet-500/15 text-violet-100 transition duration-500 group-hover:scale-110 group-hover:bg-violet-500/30">
            <Icon size={26} strokeWidth={1.5} />
          </span>
          <span className="text-4xl transition duration-500 group-hover:-translate-y-1 group-hover:rotate-12 group-hover:scale-125" aria-hidden>
            {card.emoji}
          </span>
        </div>
        <h3 className="relative mt-10 font-display text-3xl font-bold tracking-tight sm:text-4xl" style={{ transform: "translateZ(30px)" }}>
          {card.titre}
        </h3>
        <p className="relative mt-4 text-lg leading-relaxed text-white/65" style={{ transform: "translateZ(20px)" }}>
          {card.texte}
        </p>
        <span className="label relative mt-8 inline-block text-violet-300/70">
          0{index + 1} / 0{joel.ambitions.cartes.length}
        </span>
      </motion.div>
    </motion.article>
  );
}

/** Chapitre 05 — « Et maintenant ? » */
export function Ambitions() {
  const c = CHAPITRES[4];
  return (
    <section id="ambitions" data-chapter="ambitions" className="section relative px-6 py-32 sm:px-10 md:py-44">
      <div className="mx-auto max-w-6xl">
        <ChapterLabel numero={c.numero} texte={c.sousTitre} />
        <SplitText as="h2" text={joel.ambitions.titre} reveal="scale" className="title-xxl mt-6" stagger={0.05} />
        <div className="mt-16 grid gap-5 sm:grid-cols-2 md:mt-24 md:gap-7">
          {joel.ambitions.cartes.map((card, i) => (
            <Card key={card.titre} card={card} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
