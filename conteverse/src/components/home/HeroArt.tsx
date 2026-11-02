"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Compass, Sparkles } from "lucide-react";
import { Scene } from "@/components/ui/Scene";
import { Avatar, LumoMascot } from "@/components/ui/Avatar";
import { Flag } from "@/components/ui/Flag";

function Book({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 60 40" className="h-8 w-12" aria-hidden>
      <path d="M30 6 C22 0 10 0 2 4 V36 C10 32 22 32 30 38 Z" fill="#fff" stroke={color} strokeWidth="3" />
      <path d="M30 6 C38 0 50 0 58 4 V36 C50 32 38 32 30 38 Z" fill="#fff" stroke={color} strokeWidth="3" />
      <path d="M8 12 h14 M8 18 h14 M38 12 h14 M38 18 h14" stroke={color} strokeWidth="2" opacity=".5" />
    </svg>
  );
}

export function HeroArt() {
  const reduce = useReducedMotion();
  const float = (d: number) => (reduce ? {} : { animate: { y: [0, -8, 0] }, transition: { duration: 4, repeat: Infinity, delay: d } });
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="overflow-hidden rounded-[2.5rem] shadow-2xl ring-8 ring-white">
        <Scene name="savane" className="aspect-[5/4] w-full" label="Paysage de savane africaine avec un baobab au coucher du soleil" />
      </div>
      <div className="absolute bottom-6 left-6 flex items-end gap-2">
        <div className="flex flex-col items-center">
          <Avatar id="awa" size={88} />
          <Book color="#f26a0f" />
        </div>
        <div className="flex flex-col items-center">
          <Avatar id="sekou" size={76} />
          <Book color="#1f74d1" />
        </div>
      </div>
      <motion.div {...float(0)} className="absolute -right-2 bottom-10 sm:-right-6">
        <LumoMascot size={96} />
      </motion.div>
      <motion.div {...float(1)} className="absolute -left-3 top-6 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-extrabold shadow-carte sm:-left-8">
        <Flag code="GN" className="h-5 w-8" title="Drapeau de la Guinée" /> Guinée découverte !
      </motion.div>
      <motion.div {...float(2)} className="absolute right-4 top-4 flex items-center gap-2 rounded-2xl bg-violet-500 px-3 py-2 text-sm font-extrabold text-white shadow-carte">
        <Sparkles className="size-4" aria-hidden /> +20 XP
      </motion.div>
      <motion.div {...float(1.5)} className="absolute -bottom-4 right-24 hidden items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-extrabold shadow-carte sm:flex">
        <Compass className="size-4 text-orange-600" aria-hidden /> Badge : Petit explorateur
      </motion.div>
    </div>
  );
}
