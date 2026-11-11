// Cycle de vie d'une séance (spécification F5). Le statut affiché est calculé
// à la lecture : une séance passée n'apparaît jamais « à venir », même si la
// tâche planifiée n'est pas encore passée.
import type { SessionStatus } from "@/db/schema";

export type DisplayStatus = SessionStatus | "LIVE";

export const NO_SHOW_GRACE_MS = 15 * 60_000;
export const AUTO_COMPLETE_MS = 7 * 24 * 3_600_000;

type S = {
  status: SessionStatus;
  startsAt: number;
  durationMin: number;
  joinedAtMentor: number | null;
  joinedAtMentee: number | null;
};

export const endsAt = (s: Pick<S, "startsAt" | "durationMin">) => s.startsAt + s.durationMin * 60_000;

export function displayStatus(s: S, now = Date.now()): DisplayStatus {
  if (s.status === "REQUESTED" && now >= s.startsAt) return "DECLINED"; // demande restée sans réponse
  if (s.status !== "CONFIRMED") return s.status;
  const joined = s.joinedAtMentor != null || s.joinedAtMentee != null;
  if (now < s.startsAt) return "CONFIRMED";
  if (!joined && now >= s.startsAt + NO_SHOW_GRACE_MS) return "NO_SHOW";
  if (now < endsAt(s)) return "LIVE";
  return "TO_REVIEW";
}

/** Transition à enregistrer en base par la tâche planifiée (null : rien à faire). */
export function nextStoredStatus(
  s: S & { summary: string | null; rating: number | null },
  now = Date.now(),
): SessionStatus | null {
  if (s.status === "REQUESTED" && now >= s.startsAt) return "DECLINED";
  if (s.status === "CONFIRMED") {
    const joined = s.joinedAtMentor != null || s.joinedAtMentee != null;
    if (!joined && now >= s.startsAt + NO_SHOW_GRACE_MS) return "NO_SHOW";
    if (now >= endsAt(s)) return "TO_REVIEW";
  }
  if (s.status === "TO_REVIEW") {
    if ((s.summary && s.rating) || now >= endsAt(s) + AUTO_COMPLETE_MS) return "COMPLETED";
  }
  return null;
}

export const STATUS_LABEL: Record<DisplayStatus, string> = {
  REQUESTED: "Demandée",
  CONFIRMED: "Confirmée",
  LIVE: "En cours",
  TO_REVIEW: "À clôturer",
  COMPLETED: "Terminée",
  DECLINED: "Refusée",
  CANCELLED: "Annulée",
  NO_SHOW: "Absence",
};

export const isUpcoming = (d: DisplayStatus) => d === "REQUESTED" || d === "CONFIRMED" || d === "LIVE";
export const isPast = (d: DisplayStatus) => d === "TO_REVIEW" || d === "COMPLETED" || d === "NO_SHOW";
