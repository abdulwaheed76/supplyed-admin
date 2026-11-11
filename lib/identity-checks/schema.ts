import { z } from "zod"

/** Mirrors `IdentityVerificationStatus`: where one TrustID guest link stands. */
export const IDENTITY_CHECK_STATUSES = [
  "LINK_SENT",
  "SUBMITTED",
  "RESULTS_READY",
  "COMPLETED",
  "EXPIRED",
  "CANCELLED",
] as const

export const identityCheckStatusSchema = z.enum(IDENTITY_CHECK_STATUSES)

export type IdentityCheckStatus = z.infer<typeof identityCheckStatusSchema>

/** Mirrors `IdentityVerificationOutcome`: what a completed check means for the teacher. */
export const IDENTITY_CHECK_OUTCOMES = [
  "PASSED",
  "REFERRED",
  "SOFT_FAILED",
  "HARD_FAILED",
] as const

export const identityCheckOutcomeSchema = z.enum(IDENTITY_CHECK_OUTCOMES)

export type IdentityCheckOutcome = z.infer<typeof identityCheckOutcomeSchema>

/**
 * Mirrors `IdentityVerificationDecision`: whether a completed check verifies
 * the teacher. Automatic for PASSED and HARD_FAILED; an admin's call otherwise.
 */
export const IDENTITY_CHECK_DECISIONS = ["APPROVED", "REJECTED"] as const

export const identityCheckDecisionSchema = z.enum(IDENTITY_CHECK_DECISIONS)

export type IdentityCheckDecision = z.infer<typeof identityCheckDecisionSchema>

const identityCheckUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable().optional(),
})

/**
 * Mirrors `AdminIdentityVerificationDto`. Result fields stay null until
 * TrustID's results are fetched; dates arrive as ISO strings.
 */
export const identityCheckSchema = z.object({
  id: z.string(),
  user: identityCheckUserSchema,
  initiatedBy: identityCheckUserSchema.nullable().optional(),
  consentedAt: z.string().nullable().optional(),
  providerContainerId: z.string(),
  status: identityCheckStatusSchema,
  outcome: identityCheckOutcomeSchema.nullable().optional(),
  linkExpiresAt: z.string(),
  submittedAt: z.string().nullable().optional(),
  resultsReadyAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  cancelledAt: z.string().nullable().optional(),
  retrievalAttempts: z.number().int().nonnegative(),
  retrievalError: z.string().nullable().optional(),
  rightToWorkPassed: z.boolean().nullable().optional(),
  rightToWorkStatus: z
    .enum(["CONTINUOUS", "TIME_LIMITED", "REJECTED"])
    .nullable()
    .optional(),
  rightToWorkFollowUpDate: z.string().nullable().optional(),
  rightToWorkRestrictions: z.string().nullable().optional(),
  rightToWorkNotes: z.string().nullable().optional(),
  shareCodeCheck: z.boolean().nullable().optional(),
  dbsIdentityPassed: z.boolean().nullable().optional(),
  dbsInitiationState: z.number().int().nullable().optional(),
  addressVerification: z.string().nullable().optional(),
  faceMatch: z.enum(["MATCH", "UNSURE", "NO_MATCH"]).nullable().optional(),
  livenessPassed: z.boolean().nullable().optional(),
  documentAuditorStatus: z.number().int().nullable().optional(),
  documentNotes: z.string().nullable().optional(),
  decision: identityCheckDecisionSchema.nullable().optional(),
  decidedAt: z.string().nullable().optional(),
  /** Null when the decision followed from TrustID's result. */
  decidedBy: identityCheckUserSchema.nullable().optional(),
  decisionNote: z.string().nullable().optional(),
  /** Completed, REFERRED or SOFT_FAILED, and not yet approved or rejected. */
  needsDecision: z.boolean().optional(),
  hasReport: z.boolean(),
  hasDbsForm: z.boolean(),
  createdAt: z.string(),
})

export type IdentityCheck = z.infer<typeof identityCheckSchema>

export const identityChecksPaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
})

export type IdentityChecksPagination = z.infer<typeof identityChecksPaginationSchema>

export const paginatedIdentityChecksResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    verifications: z.array(identityCheckSchema),
    pagination: identityChecksPaginationSchema,
  }),
})

export const identityCheckResponseSchema = z.object({
  success: z.literal(true),
  data: identityCheckSchema,
})
