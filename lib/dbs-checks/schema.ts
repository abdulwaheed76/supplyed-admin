import { z } from "zod"

/**
 * Mirrors `DbsCheckStatus`. SEND_FAILED: it could not be sent automatically
 * (see sendProblems) and waits for an admin; SUBMITTED: with the DBS.
 */
export const dbsCheckStatusSchema = z.enum(["SEND_FAILED", "SUBMITTED", "COMPLETED"])

/** Mirrors `DbsCheckResult`. SEE_CERTIFICATE is uCheck's "wait": the certificate has content. */
export const dbsCheckResultSchema = z.enum(["CLEAR", "SEE_CERTIFICATE"])

/** Mirrors `DbsCheckDecision`: whether the result clears the teacher (sets their profile's DBS verified). */
export const DBS_CHECK_DECISIONS = ["APPROVED", "REJECTED"] as const

export const dbsCheckDecisionSchema = z.enum(DBS_CHECK_DECISIONS)

export type DbsCheckDecision = z.infer<typeof dbsCheckDecisionSchema>

const dbsCheckUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable().optional(),
})

/** Mirrors `AdminDbsCheckDto`; dates arrive as ISO strings. */
export const dbsCheckSchema = z.object({
  id: z.string(),
  user: dbsCheckUserSchema,
  identityVerificationId: z.string(),
  submittedBy: dbsCheckUserSchema.nullable().optional(),
  applicationReference: z.string(),
  /** Null until uCheck accepts it. */
  ucheckReference: z.string().nullable().optional(),
  companyCode: z.string().nullable().optional(),
  live: z.boolean(),
  evidenceCheckedBy: z.string(),
  status: dbsCheckStatusSchema,
  sendProblems: z.array(z.string()).default([]),
  result: dbsCheckResultSchema.nullable().optional(),
  disclosureNumber: z.string().nullable().optional(),
  disclosureIssuedAt: z.string().nullable().optional(),
  submittedAt: z.string().nullable().optional(),
  resultAt: z.string().nullable().optional(),
  decision: dbsCheckDecisionSchema.nullable().optional(),
  decidedAt: z.string().nullable().optional(),
  /** Null when the decision followed from a clear result. */
  decidedBy: dbsCheckUserSchema.nullable().optional(),
  decisionNote: z.string().nullable().optional(),
  needsDecision: z.boolean(),
  hasReport: z.boolean(),
  createdAt: z.string(),
})

export type DbsCheck = z.infer<typeof dbsCheckSchema>

export const dbsCheckResponseSchema = z.object({
  success: z.literal(true),
  data: dbsCheckSchema,
})

export const dbsChecksResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ dbsChecks: z.array(dbsCheckSchema) }),
})

/** Mirrors `DbsCheckPreviewDto`: what would be sent, or why it can't be. */
export const dbsCheckPreviewSchema = z.object({
  canSend: z.boolean(),
  problems: z.array(z.string()),
  notes: z.array(z.string()),
  application: z.record(z.string(), z.unknown()).nullable().optional(),
})

export type DbsCheckPreview = z.infer<typeof dbsCheckPreviewSchema>

export const dbsCheckPreviewResponseSchema = z.object({
  success: z.literal(true),
  data: dbsCheckPreviewSchema,
})

/** The body of a send or preview: which identity check, and who checked its evidence. */
export const sendDbsCheckBodySchema = z.object({
  identityVerificationId: z.string().trim().min(1).max(128),
  evidenceCheckedBy: z.string().trim().min(1).max(60),
})
