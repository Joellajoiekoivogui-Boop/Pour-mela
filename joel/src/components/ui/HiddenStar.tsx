"use client";

import { useState } from "react";
import { joel } from "@/config/joel";
import { audio } from "@/lib/audio";
import { burst, emit, findSecret, toast } from "@/lib/fx";

/** Une toute petite étoile cachée dans le site. La toucher : étoile filante et vœu. */
export function HiddenStar({ className = "" }: { className?: string }) {
  const [found, setFound] = useState(false);
  return (
    <button
      type="button"
      aria-label="Une petite étoile"
      data-cursor
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        burst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, count: 70, power: 6, colors: ["#fff", "#fde68a", "#e9d5ff"] });
        emit({ type: "shooting-star" });
        window.setTimeout(() => emit({ type: "shooting-star" }), 500);
        SCALE_UP.forEach((n, i) => window.setTimeout(() => audio.chime(n, 0.8), i * 90));
        const n = findSecret("etoile");
        toast(`${joel.secrets.etoile} · ${n}/4`, "secret");
        setFound(true);
      }}
      className={`hidden-star group grid h-8 w-8 place-items-center ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-3 w-3 transition duration-700 group-hover:scale-[2.2] ${found ? "scale-150 text-amber-200" : "text-white/35"}`}
        aria-hidden
      >
        <path fill="currentColor" d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />
      </svg>
    </button>
  );
}

const SCALE_UP = [0, 2, 4, 6, 8];
