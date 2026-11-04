import type {
  AppointmentStatus, GoalPriority, GoalStatus, MentorshipStatus, OpportunityCategory, ReportStatus,
  RequestStatus, ResourceType, SessionType, UserRole, VerificationStatus,
} from "@/types/db";

/** Libellés français des valeurs stockées en base. */
export const ROLE_LABELS: Record<UserRole, string> = {
  mentee: "Mentoré",
  mentor: "Mentor",
  admin: "Administrateur",
  super_admin: "Super administrateur",
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  pending: "En attente de vérification",
  verified: "Vérifié",
  rejected: "Non validé",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  refused: "Refusée",
  completed: "Terminée",
  cancelled: "Annulée",
};

export const MENTORSHIP_STATUS_LABELS: Record<MentorshipStatus, string> = {
  active: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "À confirmer",
  confirmed: "Confirmé",
  cancelled: "Annulé",
  completed: "Réalisé",
};

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  in_person: "Présentiel",
  video: "Visioconférence",
  audio: "Appel audio",
  written: "Échange écrit",
};
export const SESSION_TYPES = Object.keys(SESSION_TYPE_LABELS) as SessionType[];

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  not_started: "À démarrer",
  in_progress: "En cours",
  completed: "Atteint",
  abandoned: "Abandonné",
};

export const GOAL_PRIORITY_LABELS: Record<GoalPriority, string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
};

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  pdf: "Document PDF",
  image: "Image",
  link: "Lien externe",
  video: "Vidéo",
};

export const OPPORTUNITY_CATEGORY_LABELS: Record<OpportunityCategory, string> = {
  internship: "Stage",
  job: "Emploi",
  training: "Formation",
  scholarship: "Bourse",
  hackathon: "Hackathon",
  contest: "Concours",
  incubator: "Incubateur",
  call_for_projects: "Appel à projets",
  conference: "Conférence",
  networking: "Networking",
};
export const OPPORTUNITY_CATEGORIES = Object.keys(OPPORTUNITY_CATEGORY_LABELS) as OpportunityCategory[];

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: "Ouvert",
  reviewing: "En cours d'examen",
  resolved: "Résolu",
  dismissed: "Classé sans suite",
};

export const EDUCATION_LEVELS: Record<string, string> = {
  secondaire: "Secondaire (collège, lycée)",
  bac: "Baccalauréat",
  licence: "Licence",
  master: "Master",
  doctorat: "Doctorat",
  formation_pro: "Formation professionnelle",
  autodidacte: "Autodidacte",
  professionnel: "Professionnel en activité",
};

/** Accueil de chaque rôle après connexion. */
export function homeForRole(role: UserRole): string {
  if (role === "mentor") return "/mentor";
  if (role === "admin" || role === "super_admin") return "/admin";
  return "/mentore";
}
