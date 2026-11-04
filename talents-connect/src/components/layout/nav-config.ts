import {
  BarChart3, Bell, BookOpen, Bot, Briefcase, CalendarDays, ClipboardList, FileText, Flag, Handshake, LayoutDashboard,
  MessageSquare, ScrollText, Search, Settings, ShieldCheck, Star, Target, TrendingUp, UserCircle, Users, UserCog,
} from "lucide-react";
import type { UserRole } from "@/types/db";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Correspondance exacte (tableau de bord) plutôt que par préfixe. */
  exact?: boolean;
}
export interface NavGroup { title?: string; items: NavItem[] }

const MENTEE: NavGroup[] = [
  { items: [
    { href: "/mentore", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
    { href: "/mentore/trouver", label: "Trouver un mentor", icon: Search },
    { href: "/mentore/demandes", label: "Mes demandes", icon: ClipboardList },
    { href: "/mentore/mentorats", label: "Mes mentorats", icon: Handshake },
    { href: "/mentore/rendez-vous", label: "Rendez-vous", icon: CalendarDays },
    { href: "/mentore/messages", label: "Messagerie", icon: MessageSquare },
  ] },
  { title: "Progression", items: [
    { href: "/mentore/objectifs", label: "Mes objectifs", icon: Target },
    { href: "/mentore/progression", label: "Ma progression", icon: TrendingUp },
    { href: "/mentore/assistant", label: "Assistant IA", icon: Bot },
  ] },
  { title: "Explorer", items: [
    { href: "/mentore/ressources", label: "Bibliothèque", icon: BookOpen },
    { href: "/mentore/opportunites", label: "Opportunités", icon: Briefcase },
  ] },
  { title: "Compte", items: [
    { href: "/mentore/notifications", label: "Notifications", icon: Bell },
    { href: "/mentore/profil", label: "Mon profil", icon: UserCircle },
    { href: "/mentore/parametres", label: "Paramètres", icon: Settings },
  ] },
];

const MENTOR: NavGroup[] = [
  { items: [
    { href: "/mentor", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
    { href: "/mentor/demandes", label: "Demandes", icon: ClipboardList },
    { href: "/mentor/mentores", label: "Mes mentorés", icon: Users },
    { href: "/mentor/rendez-vous", label: "Calendrier", icon: CalendarDays },
    { href: "/mentor/messages", label: "Messagerie", icon: MessageSquare },
  ] },
  { title: "Partage", items: [
    { href: "/mentor/ressources", label: "Mes ressources", icon: BookOpen },
    { href: "/mentor/evaluations", label: "Évaluations", icon: Star },
    { href: "/mentor/assistant", label: "Assistant IA", icon: Bot },
  ] },
  { title: "Compte", items: [
    { href: "/mentor/notifications", label: "Notifications", icon: Bell },
    { href: "/mentor/profil", label: "Mon profil", icon: UserCircle },
    { href: "/mentor/parametres", label: "Paramètres", icon: Settings },
  ] },
];

const ADMIN: NavGroup[] = [
  { items: [{ href: "/admin", label: "Vue générale", icon: BarChart3, exact: true }] },
  { title: "Communauté", items: [
    { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
    { href: "/admin/mentors", label: "Vérification mentors", icon: ShieldCheck },
    { href: "/admin/administrateurs", label: "Administrateurs", icon: UserCog },
  ] },
  { title: "Activité", items: [
    { href: "/admin/demandes", label: "Demandes", icon: ClipboardList },
    { href: "/admin/mentorats", label: "Mentorats", icon: Handshake },
    { href: "/admin/rendez-vous", label: "Rendez-vous", icon: CalendarDays },
    { href: "/admin/evaluations", label: "Évaluations", icon: Star },
    { href: "/admin/signalements", label: "Signalements", icon: Flag },
  ] },
  { title: "Contenus", items: [
    { href: "/admin/opportunites", label: "Opportunités", icon: Briefcase },
    { href: "/admin/ressources", label: "Ressources", icon: FileText },
  ] },
  { title: "Système", items: [
    { href: "/admin/journal", label: "Journal d'activité", icon: ScrollText },
    { href: "/admin/parametres", label: "Paramètres", icon: Settings },
  ] },
];

export function navForRole(role: UserRole): NavGroup[] {
  if (role === "mentor") return MENTOR;
  if (role === "admin" || role === "super_admin") return ADMIN;
  return MENTEE;
}
