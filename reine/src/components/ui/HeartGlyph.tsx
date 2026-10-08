import { useId } from "react";

/** Le ❤️ des textes, remplacé par un petit cœur doré-rose qui bat. */
export function HeartGlyph({ className = "" }: { className?: string }) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 32 29"
      aria-hidden
      className={`heart-beat inline-block h-[0.78em] w-[0.86em] align-[-0.06em] ${className}`}
      style={{ filter: "drop-shadow(0 0 10px rgb(255 111 154 / 0.6))" }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb8cc" />
          <stop offset="0.55" stopColor="#ff6f9a" />
          <stop offset="1" stopColor="#d6336c" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id})`}
        d="M16 29s-1.4-.9-3.3-2.4C7.2 22.3 0 16.6 0 9.6 0 4.3 4 0 9 0c3 0 5.6 1.6 7 4 1.4-2.4 4-4 7-4 5 0 9 4.3 9 9.6 0 7-7.2 12.7-12.7 17C17.4 28.1 16 29 16 29z"
      />
    </svg>
  );
}
