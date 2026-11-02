import {
  Atom, BookHeart, BookOpen, Castle, CircleCheck, Compass, Eye, Flag, Landmark, Languages, Leaf, Map, Music, Plane, Rocket, Sprout, Star, Trophy, Users,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  landmark: Landmark, users: Users, map: Map, atom: Atom, leaf: Leaf, music: Music, "book-open": BookOpen, trophy: Trophy,
  sprout: Sprout, castle: Castle, star: Star, rocket: Rocket, compass: Compass, "check-circle": CircleCheck, flag: Flag,
  languages: Languages, "book-heart": BookHeart, plane: Plane, eye: Eye,
};

export function Icon({ name, className = "size-5" }: { name: string; className?: string }) {
  const C = ICONS[name] ?? Star;
  return <C className={className} aria-hidden="true" />;
}
