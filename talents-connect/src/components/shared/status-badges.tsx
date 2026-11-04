import { Badge, type BadgeTone } from "@/components/ui/badge";
import {
  APPOINTMENT_STATUS_LABELS, GOAL_PRIORITY_LABELS, GOAL_STATUS_LABELS, MENTORSHIP_STATUS_LABELS,
  REQUEST_STATUS_LABELS, VERIFICATION_LABELS,
} from "@/lib/labels";
import type { AppointmentStatus, GoalPriority, GoalStatus, MentorshipStatus, RequestStatus, VerificationStatus } from "@/types/db";

const REQUEST: Record<RequestStatus, BadgeTone> = { pending: "warning", accepted: "success", refused: "danger", completed: "neutral", cancelled: "neutral" };
const MENTORSHIP: Record<MentorshipStatus, BadgeTone> = { active: "success", completed: "neutral", cancelled: "neutral" };
const APPOINTMENT: Record<AppointmentStatus, BadgeTone> = { pending: "warning", confirmed: "primary", cancelled: "neutral", completed: "success" };
const GOAL: Record<GoalStatus, BadgeTone> = { not_started: "neutral", in_progress: "primary", completed: "success", abandoned: "neutral" };
const PRIORITY: Record<GoalPriority, BadgeTone> = { low: "neutral", medium: "violet", high: "danger" };
const VERIFICATION: Record<VerificationStatus, BadgeTone> = { pending: "warning", verified: "success", rejected: "danger" };

export const RequestBadge = ({ status }: { status: RequestStatus }) => <Badge tone={REQUEST[status]}>{REQUEST_STATUS_LABELS[status]}</Badge>;
export const MentorshipBadge = ({ status }: { status: MentorshipStatus }) => <Badge tone={MENTORSHIP[status]}>{MENTORSHIP_STATUS_LABELS[status]}</Badge>;
export const AppointmentBadge = ({ status }: { status: AppointmentStatus }) => <Badge tone={APPOINTMENT[status]}>{APPOINTMENT_STATUS_LABELS[status]}</Badge>;
export const GoalBadge = ({ status }: { status: GoalStatus }) => <Badge tone={GOAL[status]}>{GOAL_STATUS_LABELS[status]}</Badge>;
export const PriorityBadge = ({ priority }: { priority: GoalPriority }) => <Badge tone={PRIORITY[priority]}>Priorité {GOAL_PRIORITY_LABELS[priority].toLowerCase()}</Badge>;
export const VerificationBadge = ({ status }: { status: VerificationStatus }) => <Badge tone={VERIFICATION[status]}>{VERIFICATION_LABELS[status]}</Badge>;
