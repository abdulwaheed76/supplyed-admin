import { z } from "zod"

export const submissionTypeSchema = z.enum(["SCHOOL", "TEACHER"])

export const submissionStatusSchema = z.enum([
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CONVERTED",
  "CLOSED",
])

export const submissionSchema = z.object({
  id: z.string(),
  type: submissionTypeSchema,
  status: submissionStatusSchema,
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  organizationName: z.string().nullable().optional(),
  postcode: z.string().nullable().optional(),
  schoolType: z.string().nullable().optional(),
  tier: z.string().nullable().optional(),
  phase: z.string().nullable().optional(),
  availability: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  campaign: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const submissionsPaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().min(1).max(100),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
})

const submissionsDataSchema = z.object({
  submissions: z.array(submissionSchema),
  pagination: submissionsPaginationSchema,
})

const allSubmissionsDataSchema = z.object({
  submissions: z.array(submissionSchema),
})

// The API documentation shows response data; deployed backends may wrap it in
// the application's standard success envelope. Normalize both at the boundary.
export const submissionResponseSchema = z.union([
  submissionSchema,
  z
    .object({ success: z.literal(true), data: submissionSchema })
    .transform((response) => response.data),
])

export const submissionsResponseSchema = z.union([
  submissionsDataSchema,
  z
    .object({ success: z.literal(true), data: submissionsDataSchema })
    .transform((response) => response.data),
])

export const allSubmissionsResponseSchema = z.union([
  allSubmissionsDataSchema,
  z
    .object({ success: z.literal(true), data: allSubmissionsDataSchema })
    .transform((response) => response.data),
])

export type SubmissionType = z.infer<typeof submissionTypeSchema>
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>
export type WaitingListSubmission = z.infer<typeof submissionSchema>
export type WaitingListPagination = z.infer<typeof submissionsPaginationSchema>
