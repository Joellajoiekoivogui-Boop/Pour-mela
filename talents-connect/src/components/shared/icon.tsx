import {
  BadgeCheck, BookOpen, BrainCircuit, CalendarCheck, Code, Compass, Kanban, Lock, Megaphone, Palette, Rocket, Scale,
  ShieldCheck, Smartphone, Sparkles, Sprout, Target, Users, Wallet,
} from "lucide-react";

// Icônes référencées par leur nom en base (expertise_domains.icon) ou dans les contenus.
const ICONS = {
  "badge-check": BadgeCheck, "book-open": BookOpen, "brain-circuit": BrainCircuit, "calendar-check": CalendarCheck,
  code: Code, compass: Compass, kanban: Kanban, lock: Lock, megaphone: Megaphone, palette: Palette, rocket: Rocket,
  scale: Scale, "shield-check": ShieldCheck, smartphone: Smartphone, sparkles: Sparkles, sprout: Sprout, target: Target,
  users: Users, wallet: Wallet,
} as const;

export function NamedIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name as keyof typeof ICONS] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}
