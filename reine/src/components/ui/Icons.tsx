import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function CrownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 8.5l4 3.5 5-7 5 7 4-3.5-1.8 9.5H4.8L3 8.5z" />
      <path d="M5 20.5h14" />
      <circle cx="12" cy="4.2" r="0.9" fill="currentColor" />
      <circle cx="3" cy="8.2" r="0.8" fill="currentColor" />
      <circle cx="21" cy="8.2" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.5c.6 4.6 2.9 6.9 7.5 7.5-4.6.6-6.9 2.9-7.5 7.5-.6-4.6-2.9-6.9-7.5-7.5 4.6-.6 6.9-2.9 7.5-7.5z" />
      <path d="M19 16.5c.25 1.6 1 2.35 2.5 2.5-1.5.25-2.25 1-2.5 2.5-.25-1.5-1-2.25-2.5-2.5 1.5-.15 2.25-.9 2.5-2.5z" />
    </svg>
  );
}

export function SmileIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14.2c1.1 1.5 2.4 2.2 4 2.2s2.9-.7 4-2.2" />
      <path d="M9 9.6v.6M15 9.6v.6" strokeWidth={1.8} />
    </svg>
  );
}

export function HandHeartIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 11.5s-3.5-2-3.5-4.3A1.9 1.9 0 0112 6.2a1.9 1.9 0 013.5 1c0 2.3-3.5 4.3-3.5 4.3z" />
      <path d="M3 14.5l3.2-1.6c.8-.4 1.7-.4 2.5 0l3.3 1.6h3a1.5 1.5 0 010 3H11" />
      <path d="M14.5 17.5l4.6-2.4a1.6 1.6 0 012 2.2L15.5 21H8.2L3 19" />
    </svg>
  );
}

export function LaughIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M7.6 9.8l1.6-1.2 1.6 1.2M13.2 9.8l1.6-1.2 1.6 1.2" />
      <path d="M7.5 13h9c-.4 2.6-2.2 4.2-4.5 4.2S7.9 15.6 7.5 13z" />
    </svg>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0112 7.3a4.3 4.3 0 017.5 2.5C19.5 15.4 12 20 12 20z" />
    </svg>
  );
}

export function RoseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5c3 0 5 2 5 4.6S14.8 12.5 12 12.5 7 10.7 7 8.1 9 3.5 12 3.5z" />
      <path d="M12 6.2c1.3 0 2.2.8 2.2 1.9S13.2 10 12 10s-1.9-.9-1.6-1.9" />
      <path d="M12 12.5V21M12 16c-2.6-2.4-5-1.8-5.5-.6 1.6 1.2 3.4 1.4 5.5.6zM12 18c1.8-1.8 3.8-1.6 4.4-.6-1.2 1-2.6 1.2-4.4.6z" />
    </svg>
  );
}

export function InfinityIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 12c-2-2.6-3.6-3.9-5.4-3.9a3.9 3.9 0 000 7.8c1.8 0 3.4-1.3 5.4-3.9zm0 0c2 2.6 3.6 3.9 5.4 3.9a3.9 3.9 0 000-7.8c-1.8 0-3.4 1.3-5.4 3.9z" />
    </svg>
  );
}

export function ReplayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12a8 8 0 102.4-5.7M4 4v4.5h4.5" />
    </svg>
  );
}

const ICONS = {
  etoile: StarIcon,
  sourire: SmileIcon,
  main: HandHeartIcon,
  rire: LaughIcon,
  couronne: CrownIcon,
  coeur: HeartIcon,
  rose: RoseIcon,
  infini: InfinityIcon,
} as const;

/** Icône d'un souvenir à partir de son nom dans la configuration. */
export function MemoryIcon({ name, ...props }: IconProps & { name: string }) {
  const Icon = ICONS[name as keyof typeof ICONS] ?? StarIcon;
  return <Icon {...props} />;
}
