import { z } from "zod";
import { OPPORTUNITY_CATEGORIES, SESSION_TYPES } from "@/lib/labels";

/**
 * Schémas de validation partagés : utilisés par les formulaires (React Hook
 * Form) ET revérifiés dans les actions serveur. Ne jamais faire confiance aux
 * seules vérifications du navigateur.
 */

const trimmed = (max: number) => z.string().trim().max(max, `${max} caractères maximum`);
const optionalText = (max: number) => trimmed(max).optional().transform((v) => (v ? v : null));
const httpUrl = z.string().trim().url("Adresse invalide").refine((v) => /^https?:\/\//i.test(v), "L'adresse doit commencer par http(s)://");
const optionalUrl = z.union([httpUrl, z.literal("")]).optional().transform((v) => (v ? v : null));

export const passwordSchema = z
  .string()
  .min(8, "8 caractères minimum")
  .max(72, "72 caractères maximum")
  .regex(/[A-Za-z]/, "Au moins une lettre")
  .regex(/[0-9]/, "Au moins un chiffre");

export const signUpSchema = z.object({
  role: z.enum(["mentee", "mentor"], { message: "Choisissez votre profil" }),
  firstName: trimmed(80).min(2, "Prénom requis"),
  lastName: trimmed(80).min(2, "Nom requis"),
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide"),
  password: passwordSchema,
  acceptTerms: z.literal(true, { message: "Vous devez accepter les conditions d'utilisation" }),
});
export type SignUpInput = z.input<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Mot de passe requis"),
  next: z.string().optional(),
});
export type SignInInput = z.input<typeof signInSchema>;

export const emailSchema = z.object({ email: z.string().trim().toLowerCase().email("Adresse e-mail invalide") });

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "Les mots de passe ne correspondent pas", path: ["confirm"] });

const idList = z.array(z.coerce.number().int().positive()).max(40);

export const baseProfileSchema = z.object({
  firstName: trimmed(80).min(2, "Prénom requis"),
  lastName: trimmed(80).min(2, "Nom requis"),
  location: optionalText(120),
  bio: optionalText(2000),
  domainIds: idList,
  skillIds: idList,
});

export const menteeProfileSchema = baseProfileSchema.extend({
  birthDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"), z.literal("")]).optional()
    .transform((v) => (v ? v : null)),
  educationLevel: z.union([z.enum(["secondaire", "bac", "licence", "master", "doctorat", "formation_pro", "autodidacte", "professionnel"]), z.literal("")])
    .optional().transform((v) => (v ? v : null)),
  institution: optionalText(160),
  fieldOfStudy: optionalText(160),
  interests: optionalText(1000),
  professionalGoals: optionalText(2000),
  projectNeeds: optionalText(2000),
  hasSkillIds: idList,
});
export type MenteeProfileInput = z.input<typeof menteeProfileSchema>;

export const mentorProfileSchema = baseProfileSchema.extend({
  jobTitle: trimmed(120).min(2, "Poste requis"),
  organization: optionalText(120),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  education: optionalText(1000),
  experiences: optionalText(3000),
  languages: z.array(trimmed(40).min(2)).min(1, "Au moins une langue").max(8),
  availabilityNote: optionalText(500),
  supportTypes: z.array(z.enum(SESSION_TYPES as [string, ...string[]])).min(1, "Au moins un type d'accompagnement"),
  maxMentees: z.coerce.number().int().min(1).max(50),
});
export type MentorProfileInput = z.input<typeof mentorProfileSchema>;

export const mentorRequestSchema = z.object({
  mentorId: z.string().uuid(),
  motivation: trimmed(2000).min(20, "Expliquez votre motivation (20 caractères minimum)"),
  objectives: trimmed(2000).min(10, "Décrivez vos objectifs (10 caractères minimum)"),
});
export type MentorRequestInput = z.input<typeof mentorRequestSchema>;

export const goalSchema = z.object({
  title: trimmed(160).min(3, "Titre requis"),
  description: optionalText(2000),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]).optional().transform((v) => (v ? v : null)),
  mentorshipId: z.union([z.string().uuid(), z.literal("")]).optional().transform((v) => (v ? v : null)),
  milestones: z.array(trimmed(200).min(2)).max(30),
  /** Rempli quand c'est le mentor qui crée l'objectif pour son mentoré. */
  menteeId: z.string().uuid().optional(),
});
export type GoalInput = z.input<typeof goalSchema>;

export const slotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Heure invalide"),
  durationMinutes: z.coerce.number().int().min(15).max(240),
  sessionTypes: z.array(z.enum(SESSION_TYPES as [string, ...string[]])).min(1, "Au moins un type de séance"),
  repeatWeeks: z.coerce.number().int().min(1).max(12),
});
export type SlotInput = z.input<typeof slotSchema>;

export const bookingSchema = z.object({
  slotId: z.string().uuid(),
  mentorshipId: z.string().uuid(),
  sessionType: z.enum(SESSION_TYPES as [string, ...string[]]),
  topic: optionalText(300),
});

export const resourceSchema = z.object({
  title: trimmed(200).min(3, "Titre requis"),
  description: optionalText(2000),
  domainId: z.coerce.number().int().positive({ message: "Catégorie requise" }),
  type: z.enum(["pdf", "image", "link", "video"]),
  url: optionalUrl,
});

export const opportunitySchema = z.object({
  title: trimmed(200).min(3, "Titre requis"),
  organization: trimmed(160).min(2, "Organisation requise"),
  description: trimmed(5000).min(10, "Description requise"),
  category: z.enum(OPPORTUNITY_CATEGORIES as [string, ...string[]]),
  domainId: z.union([z.coerce.number().int().positive(), z.literal("")]).optional().transform((v) => (v ? Number(v) : null)),
  location: optionalText(160),
  deadline: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]).optional().transform((v) => (v ? v : null)),
  requirements: optionalText(3000),
  applyUrl: optionalUrl,
  imageUrl: optionalUrl,
  isPublished: z.coerce.boolean(),
});
export type OpportunityInput = z.input<typeof opportunitySchema>;

export const reviewSchema = z.object({
  mentorshipId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: optionalText(1500),
});

export const reportSchema = z.object({
  targetType: z.enum(["user", "message", "resource", "opportunity", "review"]),
  targetId: z.string().uuid().optional(),
  targetUserId: z.string().uuid().optional(),
  reason: trimmed(200).min(3, "Motif requis"),
  details: optionalText(2000),
});
