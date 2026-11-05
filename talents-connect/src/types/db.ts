/**
 * Types des lignes de la base, écrits à la main d'après les migrations
 * (supabase/migrations). Ils peuvent être remplacés par des types générés :
 *   npx supabase gen types typescript --project-id <id> > src/types/supabase.ts
 */

export type UserRole = "mentee" | "mentor" | "admin" | "super_admin";
export type VerificationStatus = "pending" | "verified" | "rejected";
export type RequestStatus = "pending" | "accepted" | "refused" | "completed" | "cancelled";
export type MentorshipStatus = "active" | "completed" | "cancelled";
export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type SessionType = "in_person" | "video" | "audio" | "written";
export type GoalStatus = "not_started" | "in_progress" | "completed" | "abandoned";
export type GoalPriority = "low" | "medium" | "high";
export type SkillRelation = "has" | "wants" | "teaches";
export type ResourceType = "pdf" | "image" | "link" | "video";
export type OpportunityCategory =
  | "internship" | "job" | "training" | "scholarship" | "hackathon"
  | "contest" | "incubator" | "call_for_projects" | "conference" | "networking";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export interface Profile {
  id: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  location: string | null;
  bio: string | null;
  is_demo: boolean;
  is_suspended: boolean;
  created_at: string;
}

export interface MentorProfile {
  user_id: string;
  job_title: string | null;
  organization: string | null;
  years_experience: number;
  education: string | null;
  experiences: string | null;
  languages: string[];
  availability_note: string | null;
  support_types: SessionType[];
  max_mentees: number;
  verification_status: VerificationStatus;
  verified_at: string | null;
  rejection_reason: string | null;
}

export interface MenteeProfile {
  user_id: string;
  birth_date: string | null;
  education_level: string | null;
  institution: string | null;
  field_of_study: string | null;
  interests: string | null;
  professional_goals: string | null;
  project_needs: string | null;
}

export interface Domain {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
}

export interface Skill {
  id: number;
  slug: string;
  name: string;
  domain_id: number | null;
}

export interface MentorRequest {
  id: string;
  mentee_id: string;
  mentor_id: string;
  motivation: string;
  objectives: string;
  match_score: number | null;
  status: RequestStatus;
  response_message: string | null;
  responded_at: string | null;
  created_at: string;
}

export interface Mentorship {
  id: string;
  request_id: string | null;
  mentor_id: string;
  mentee_id: string;
  status: MentorshipStatus;
  started_at: string;
  ended_at: string | null;
}

export interface Goal {
  id: string;
  mentee_id: string;
  mentorship_id: string | null;
  title: string;
  description: string | null;
  priority: GoalPriority;
  status: GoalStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  position: number;
  is_done: boolean;
  done_at: string | null;
  /** Intention de mise en œuvre : « Quand…, je… » */
  intention: string | null;
}

export interface GoalComment {
  id: string;
  goal_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface AvailabilitySlot {
  id: string;
  mentor_id: string;
  starts_at: string;
  ends_at: string;
  session_types: SessionType[];
  is_booked: boolean;
}

export interface Appointment {
  id: string;
  mentorship_id: string;
  slot_id: string | null;
  mentor_id: string;
  mentee_id: string;
  starts_at: string;
  ends_at: string;
  session_type: SessionType;
  status: AppointmentStatus;
  topic: string | null;
  location_or_link: string | null;
  mentor_notes: string | null;
  cancel_reason: string | null;
  rescheduled_from: string | null;
  /** Ce que le mentoré retient de la séance, et suivi de sa révision. */
  mentee_takeaways: string | null;
  takeaways_at: string | null;
  reviewed_at: string | null;
  review_count: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  mentorship_id: string | null;
  last_message_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  attachment_path: string | null;
  attachment_name: string | null;
  created_at: string;
}

export interface Resource {
  id: string;
  author_id: string | null;
  domain_id: number | null;
  title: string;
  description: string | null;
  type: ResourceType;
  url: string | null;
  file_path: string | null;
  is_published: boolean;
  created_at: string;
}

export interface Opportunity {
  id: string;
  created_by: string | null;
  domain_id: number | null;
  title: string;
  organization: string;
  description: string;
  category: OpportunityCategory;
  location: string | null;
  deadline: string | null;
  requirements: string | null;
  apply_url: string | null;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  mentorship_id: string;
  reviewer_id: string;
  mentor_id: string;
  rating: number;
  comment: string | null;
  is_hidden: boolean;
  created_at: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string | null;
  target_user_id: string | null;
  target_type: string;
  target_id: string | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  resolution_note: string | null;
  created_at: string;
}

/** Profil public minimal joint dans les listes. */
export type PersonSummary = Pick<Profile, "id" | "first_name" | "last_name" | "avatar_url">;
