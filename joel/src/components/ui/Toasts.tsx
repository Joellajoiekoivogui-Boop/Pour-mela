"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { onFx } from "@/lib/fx";

interface Item {
  id: number;
  text: string;
  tone?: "secret" | "party";
}

/** Messages éphémères qui flottent en bas de l'écran (secrets, fête). */
export function Toasts() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    let id = 0;
    return onFx((event) => {
      if (event.type !== "toast") return;
      const item = { id: ++id, text: event.text, tone: event.tone };
      setItems((list) => [...list.slice(-3), item]);
      window.setTimeout(() => setItems((list) => list.filter((i) => i.id !== item.id)), 4200);
    });
  }, []);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--safe-bottom)+24px)] z-[70] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 30, scale: 0.9, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className={`glass max-w-md rounded-full px-5 py-3 text-center text-sm font-medium text-white sm:text-base ${item.tone === "secret" ? "border-fuchsia-300/40 shadow-[0_0_40px_rgba(217,70,239,0.25)]" : ""}`}
          >
            {item.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
