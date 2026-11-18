import { z } from "zod"

import { identityChecksPaginationSchema } from "@/lib/identity-checks/schema"

/**
 * Mirrors `DegreeCheckStatus`. UNCONFIRMED: Hedd's answer to sending it never
 * arrived. MORE_INFORMATION: answered on the Hedd website, not here.
 */
export const DEGREE_CHECK_STATUSES = [
  "UNCONFIRMED",
  "WAITING",
  "MORE_INFORMATION",
  "VERIFIED",
  "CANCELLED",
] as const

export const degreeCheckStatusSchema = z.enum(DEGREE_CHECK_STATUSES)

export type DegreeCheckStatus = z.infer<typeof degreeCheckStatusSchema>

/** Mirrors `DegreeCheckDecision`: whether schools see the degree as verified. */
export const degreeCheckDecisionSchema = z.enum(["APPROVED", "REJECTED"])

export type DegreeCheckDecision = z.infer<typeof degreeCheckDecisionSchema>

const degreeCheckUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable().optional(),
})

/** The degree as the university confirmed it; a field it corrected without a value is null. */
const verifiedDegreeSchema = z.object({
  institutionName: z.string(),
  qualificationType: z.string().nullable(),
  courseName: z.string().nullable(),
  classification: z.string().nullable(),
  yearOfAward: z.number().nullable(),
})

/** Mirrors `AdminDegreeCheckDto`; dates arrive as ISO strings. */
export const degreeCheckSchema = z.object({
  id: z.string(),
  user: degreeCheckUserSchema,
  institutionId: z.number(),
  institutionName: z.string(),
  firstNames: z.string(),
  lastName: z.string(),
  lastNameAtStudy: z.string().nullable().optional(),
  dateOfBirth: z.string(),
  courseName: z.string(),
  qualificationType: z.string(),
  classification: z.string(),
  yearOfAward: z.number(),
  live: z.boolean(),
  status: degreeCheckStatusSchema,
  heddGuid: z.string().nullable().optional(),
  heddReference: z.number().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  /** Hedd's field names, with the university's value: '' when it gave none, null when withheld. */
  corrections: z.record(z.string(), z.unknown()).nullable().optional(),
  attendanceFrom: z.string().nullable().optional(),
  attendanceTo: z.string().nullable().optional(),
  verifiedOn: z.string().nullable().optional(),
  lastCheckedAt: z.string().nullable().optional(),
  decision: degreeCheckDecisionSchema.nullable().optional(),
  decidedAt: z.string().nullable().optional(),
  /** Null when it was approved automatically (nothing corrected). */
  decidedBy: degreeCheckUserSchema.nullable().optional(),
  decisionNote: z.string().nullable().optional(),
  needsAction: z.boolean(),
  degree: verifiedDegreeSchema.nullable().optional(),
  createdAt: z.string(),
})

export type DegreeCheck = z.infer<typeof degreeCheckSchema>

export const paginatedDegreeChecksResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    degreeChecks: z.array(degreeCheckSchema),
    pagination: identityChecksPaginationSchema,
  }),
})

export const degreeCheckResponseSchema = z.object({
  success: z.literal(true),
  data: degreeCheckSchema,
})
