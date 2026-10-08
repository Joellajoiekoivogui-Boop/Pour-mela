"use client";

import { motion } from "motion/react";
import { joel } from "@/config/joel";
import { SplitText } from "../ui/SplitText";

/** Le message d'anniversaire, grand et lumineux. */
export function BirthdayMessage() {
  const t = joel.message;
  return (
    <section id="anniversaire" data-chapter="message" className="section relative px-6 pb-40 sm:px-10 md:pb-56">
      <div className="mx-auto max-w-5xl">
        <SplitText as="h2" text={t.titre} reveal="blur" stagger={0.03} className="title-xl text-center" charClass="grad-char" />
        <div className="glass mx-auto mt-16 max-w-3xl rounded-[32px] p-8 sm:p-14">
          {t.paragraphes.map((p, i) => (
            <motion.p
              key={i}
              className={
                i === 0
                  ? "text-[clamp(1.25rem,2.6vw,1.75rem)] font-light leading-relaxed text-white/90"
                  : i === t.paragraphes.length - 1
                    ? "mt-8 text-[clamp(1.2rem,2.4vw,1.6rem)] font-semibold leading-relaxed text-white"
                    : "mt-5 text-[clamp(1.1rem,2.2vw,1.4rem)] text-white/70"
              }
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {p}
            </motion.p>
          ))}
        </div>
      </div>
    </section>
  );
}
