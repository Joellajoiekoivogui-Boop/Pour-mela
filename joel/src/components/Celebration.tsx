"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { joel } from "@/config/joel";
import { audio } from "@/lib/audio";
import { burst, confetti, emit, onFx, PARTY_COLORS, toast, vibrate } from "@/lib/fx";
import { stage } from "@/lib/stage";

/**
 * Le mode célébration : confettis, gerbes d'étincelles, éclair, vibration,
 * fond qui s'embrase quelques secondes et messages qui apparaissent. En
 * grand (minuit pile, ou le jour J à l'arrivée), le titre
 * « JOYEUX ANNIVERSAIRE JOËL 🎂 » remplit l'écran.
 */
export function Celebration() {
  const [banner, setBanner] = useState(0);

  useEffect(() => {
    const timers: number[] = [];
    let messageIndex = 0;
    let decay = 0;
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

    const off = onFx((event) => {
      if (event.type !== "celebrate") return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const big = event.big;
      audio.fanfare();
      vibrate(stage.quality.reducedMotion ? 30 : [40, 60, 40, 60, 120]);
      emit({ type: "flash", strength: big ? 0.9 : 0.5 });
      confetti({ count: big ? 240 : 170 });
      const waves = stage.quality.reducedMotion ? 1 : big ? 7 : 4;
      for (let i = 0; i < waves; i++) {
        later(250 + i * 380, () => {
          burst({ x: w * (0.15 + Math.random() * 0.7), y: h * (0.15 + Math.random() * 0.45), count: 90, power: 8, colors: PARTY_COLORS });
          audio.chime(i * 2, 0.6);
        });
      }
      later(900, () => confetti({ count: big ? 160 : 90, power: 18 }));
      later(1400, () => burst({ x: w / 2, y: h, count: 120, power: 5, rise: true }));

      // Le fond s'embrase puis s'apaise.
      document.documentElement.dataset.party = "";
      stage.party = 1;
      window.clearInterval(decay);
      decay = window.setInterval(() => {
        stage.party *= 0.97;
        if (stage.party < 0.02) {
          stage.party = 0;
          delete document.documentElement.dataset.party;
          window.clearInterval(decay);
        }
      }, 60);

      if (big) {
        setBanner((b) => b + 1);
        later(5200, () => setBanner(0));
      }
      const messages = joel.final.messages;
      for (let i = 0; i < 2; i++) {
        later(big ? 3000 + i * 1600 : 500 + i * 1500, () => {
          toast(messages[messageIndex % messages.length], "party");
          messageIndex++;
        });
      }
    });
    return () => {
      off();
      timers.forEach(window.clearTimeout);
      window.clearInterval(decay);
    };
  }, []);

  const title = joel.message.titre;
  return (
    <AnimatePresence>
      {banner > 0 && (
        <motion.div
          key={banner}
          role="status"
          className="pointer-events-none fixed inset-0 z-[65] grid place-items-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(20px)", scale: 1.1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(46,16,101,0.9),rgba(5,5,10,0.88)_65%)]" />
          <h2
            className="relative text-center font-display text-[clamp(2.6rem,10vw,9rem)] font-extrabold uppercase leading-[0.9] tracking-tight"
            aria-label={title}
          >
            {title.split(" ").map((word, w) => (
              <span key={w} className="inline-block whitespace-nowrap">
                {Array.from(word).map((char, c) => (
                  <motion.span
                    key={c}
                    aria-hidden
                    className="text-glow inline-block"
                    initial={{ opacity: 0, y: 80, rotate: (c % 2 ? 1 : -1) * 25, scale: 0.4 }}
                    animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.15 + (w * 6 + c) * 0.04 }}
                  >
                    {char}
                  </motion.span>
                ))}
                &nbsp;
              </span>
            ))}
          </h2>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
