// Schéma de la base MonMentor (SQLite / libSQL).
// Toute modification doit être reportée dans un nouveau fichier drizzle/NNNN_*.sql.
import { sqliteTable, text, integer, primaryKey, uniqueIndex, index } from "drizzle-orm/sqlite-core";

const id = () => text("id").primaryKey();
const createdAt = () => integer("created_at").notNull();
const json = <T>(name: string) => text(name, { mode: "json" }).$type<T>();

export type Role = "MENTEE" | "MENTOR" | "ADMIN";
export type Channel = "whatsapp" | "sms" | "email";
export type Slot = { day: number; hour: number }; // day : 1 = lundi … 7 = dimanche

export const users = sqliteTable("users", {
  id: id(),
  role: text("role").$type<Role>().notNull(),
  name: text("name").notNull(),
  email: text("email").unique(),
  phone: text("phone").unique(),
  passwordHash: text("password_hash"),
  city: text("city").notNull().default("Conakry"),
  country: text("country").notNull().default("Guinée"),
  birthDate: text("birth_date"),
  bio: text("bio"),
  gender: text("gender").$type<"F" | "M" | "X">(),
  preferredChannel: text("preferred_channel").$type<Channel>().notNull().default("whatsapp"),
  isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
  charterVersion: text("charter_version"),
  charterAcceptedAt: integer("charter_accepted_at"),
  parentName: text("parent_name"),
  parentPhone: text("parent_phone"),
  parentConsentToken: text("parent_consent_token"),
  parentConsentAt: integer("parent_consent_at"),
  suspendedAt: integer("suspended_at"),
  createdAt: createdAt(),
});

export const mentorProfiles = sqliteTable("mentor_profiles", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  organization: text("organization"),
  yearsExperience: integer("years_experience").notNull().default(0),
  primaryDomain: text("primary_domain").notNull(),
  domains: json<string[]>("domains").notNull(),
  skills: json<string[]>("skills").notNull(),
  languages: json<string[]>("languages").notNull(),
  formats: json<string[]>("formats").notNull(),
  capacity: integer("capacity").notNull().default(3),
  verificationLevel: integer("verification_level").notNull().default(0),
  slots: json<Slot[]>("slots").notNull(),
  linkedinUrl: text("linkedin_url"),
});

export const menteeProfiles = sqliteTable("mentee_profiles", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  situation: text("situation"),
  need: text("need"),
  domains: json<string[]>("domains").notNull(),
});

export const mentorships = sqliteTable(
  "mentorships",
  {
    id: id(),
    mentorId: text("mentor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    menteeId: text("mentee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    status: text("status").$type<"PENDING" | "ACTIVE" | "DECLINED" | "ENDED">().notNull(),
    message: text("message"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("mentorships_pair").on(t.mentorId, t.menteeId)],
);

export type SessionStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "DECLINED"
  | "CANCELLED"
  | "TO_REVIEW"
  | "COMPLETED"
  | "NO_SHOW";

export const sessions = sqliteTable(
  "sessions",
  {
    id: id(),
    mentorId: text("mentor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    menteeId: text("mentee_id").references(() => users.id, { onDelete: "cascade" }),
    cohortId: text("cohort_id"),
    title: text("title").notNull(),
    startsAt: integer("starts_at").notNull(),
    durationMin: integer("duration_min").notNull().default(45),
    format: text("format").$type<"visio" | "chat" | "presentiel">().notNull().default("visio"),
    status: text("status").$type<SessionStatus>().notNull(),
    objectiveId: text("objective_id"),
    joinedAtMentor: integer("joined_at_mentor"),
    joinedAtMentee: integer("joined_at_mentee"),
    summary: text("summary"),
    nextActions: json<string[]>("next_actions"),
    skillWorked: text("skill_worked"),
    rating: integer("rating"),
    ratingComment: text("rating_comment"),
    closedAt: integer("closed_at"),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_mentor").on(t.mentorId), index("sessions_mentee").on(t.menteeId)],
);

export const objectives = sqliteTable("objectives", {
  id: id(),
  menteeId: text("mentee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  domain: text("domain").notNull(),
  dueDate: text("due_date"),
  mentorComment: text("mentor_comment"),
  mentorCommentBy: text("mentor_comment_by"),
  createdAt: createdAt(),
});

export const objectiveSteps = sqliteTable("objective_steps", {
  id: id(),
  objectiveId: text("objective_id").notNull().references(() => objectives.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  dueDate: text("due_date"),
  position: integer("position").notNull().default(0),
  fromSessionId: text("from_session_id"),
});

export const messages = sqliteTable(
  "messages",
  {
    id: id(),
    senderId: text("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    recipientId: text("recipient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    readAt: integer("read_at"),
    createdAt: createdAt(),
  },
  (t) => [index("messages_pair").on(t.senderId, t.recipientId)],
);

export const resources = sqliteTable("resources", {
  id: id(),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").$type<"guide" | "checklist" | "modele" | "livre" | "video">().notNull(),
  domain: text("domain").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  body: text("body").notNull(),
  minutes: integer("minutes").notNull().default(5),
  hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

export const opportunities = sqliteTable("opportunities", {
  id: id(),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").$type<"stage" | "emploi" | "bourse" | "concours" | "incubation" | "evenement">().notNull(),
  domain: text("domain").notNull(),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  deadline: text("deadline").notNull(),
  url: text("url"),
  hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

export const opportunityInterests = sqliteTable(
  "opportunity_interests",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    opportunityId: text("opportunity_id").notNull().references(() => opportunities.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.opportunityId] })],
);

export type Visibility = "PRIVATE" | "LINK" | "PUBLIC";

export const careerProfiles = sqliteTable("career_profiles", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  visibility: text("visibility").$type<Visibility>().notNull().default("PRIVATE"),
  headline: text("headline"),
  summary: text("summary"),
  language: text("language").$type<"fr" | "en">().notNull().default("fr"),
  template: text("template").$type<"sobre" | "academique" | "entrepreneur">().notNull().default("sobre"),
  hidden: json<string[]>("hidden").notNull(),
  shareToken: text("share_token").notNull(),
  viewCount: integer("view_count").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
});

export const experiences = sqliteTable("experiences", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").$type<"EXPERIENCE" | "EDUCATION">().notNull(),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  start: text("start").notNull(),
  end: text("end"),
  description: text("description"),
});

export const skillEndorsements = sqliteTable(
  "skill_endorsements",
  {
    id: id(),
    menteeId: text("mentee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    mentorId: text("mentor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    skill: text("skill").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("endorsement_unique").on(t.menteeId, t.mentorId, t.skill)],
);

export const recommendations = sqliteTable("recommendations", {
  id: id(),
  menteeId: text("mentee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mentorId: text("mentor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  status: text("status").$type<"PENDING" | "APPROVED" | "HIDDEN">().notNull().default("PENDING"),
  createdAt: createdAt(),
});

export const certificates = sqliteTable("certificates", {
  id: id(),
  code: text("code").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  programId: text("program_id"),
  issuedBy: text("issued_by"),
  issuedAt: integer("issued_at").notNull(),
  revokedAt: integer("revoked_at"),
});

export const shareEvents = sqliteTable("share_events", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(),
  createdAt: createdAt(),
});

export const verifications = sqliteTable("verifications", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  level: integer("level").notNull(),
  evidence: text("evidence"),
  status: text("status").$type<"PENDING" | "APPROVED" | "REJECTED">().notNull(),
  reviewerId: text("reviewer_id"),
  note: text("note"),
  createdAt: createdAt(),
  reviewedAt: integer("reviewed_at"),
});

export type ReportReason = "HARASSMENT" | "SCAM" | "INAPPROPRIATE" | "FAKE_PROFILE" | "OTHER";

export const reports = sqliteTable("reports", {
  id: id(),
  reporterId: text("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetType: text("target_type").$type<"USER" | "MESSAGE" | "SESSION" | "RESOURCE" | "OPPORTUNITY">().notNull(),
  targetId: text("target_id").notNull(),
  targetUserId: text("target_user_id"),
  reason: text("reason").$type<ReportReason>().notNull(),
  details: text("details"),
  status: text("status").$type<"OPEN" | "IN_REVIEW" | "ACTIONED" | "DISMISSED">().notNull().default("OPEN"),
  action: text("action"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: integer("reviewed_at"),
  createdAt: createdAt(),
});

export const notifications = sqliteTable(
  "notifications",
  {
    id: id(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    channel: text("channel").$type<Channel | "inapp">().notNull(),
    body: text("body").notNull(),
    link: text("link"),
    status: text("status").$type<"QUEUED" | "SENT" | "FAILED" | "CANCELLED">().notNull(),
    scheduledAt: integer("scheduled_at").notNull(),
    sentAt: integer("sent_at"),
    readAt: integer("read_at"),
    sessionId: text("session_id"),
    urgent: integer("urgent", { mode: "boolean" }).notNull().default(false),
    error: text("error"),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_due").on(t.status, t.scheduledAt)],
);

export const otpCodes = sqliteTable("otp_codes", {
  id: id(),
  phone: text("phone").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: integer("expires_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
  consumedAt: integer("consumed_at"),
  createdAt: createdAt(),
});

export const authSessions = sqliteTable("auth_sessions", {
  id: id(), // empreinte SHA-256 du jeton du cookie
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
  createdAt: createdAt(),
});

export const programs = sqliteTable("programs", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  domain: text("domain").notNull(),
  weeks: integer("weeks").notNull(),
  sessionsCount: integer("sessions_count").notNull(),
  sessionMinutes: integer("session_minutes").notNull(),
  summary: text("summary").notNull(),
  deliverable: text("deliverable").notNull(),
  steps: json<string[]>("steps").notNull(),
  certificateTitle: text("certificate_title").notNull(),
});

export const cohorts = sqliteTable("cohorts", {
  id: id(),
  programId: text("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
  mentorId: text("mentor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startsOn: text("starts_on").notNull(),
  capacity: integer("capacity").notNull().default(8),
  status: text("status").$type<"OPEN" | "RUNNING" | "DONE">().notNull().default("OPEN"),
  createdAt: createdAt(),
});

export const cohortMembers = sqliteTable(
  "cohort_members",
  {
    cohortId: text("cohort_id").notNull().references(() => cohorts.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    status: text("status").$type<"ENROLLED" | "WAITLIST">().notNull(),
    attendance: integer("attendance").notNull().default(0),
    deliverableValidated: integer("deliverable_validated", { mode: "boolean" }).notNull().default(false),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.cohortId, t.userId] })],
);

export const matchEvents = sqliteTable("match_events", {
  id: id(),
  menteeId: text("mentee_id").notNull(),
  mentorId: text("mentor_id").notNull(),
  event: text("event").$type<"SHOWN" | "CONTACTED" | "ACCEPTED">().notNull(),
  score: integer("score"),
  createdAt: createdAt(),
});

export const auditLog = sqliteTable("audit_log", {
  id: id(),
  actorId: text("actor_id").notNull(),
  action: text("action").notNull(),
  target: text("target"),
  createdAt: createdAt(),
});

export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStart: integer("window_start").notNull(),
});
