import { z } from "zod"

import { documentRequirementSchema } from "@/lib/document-requirements/schema"
import { documentTypeSchema } from "@/lib/document-types/schema"

/**
 * Mirrors the `DocumentVerificationStatus` enum in the backend's Prisma
 * schema. `NOT_REQUIRED` is the resting state of a document whose requirement
 * has `requiresReview` off; it never enters the review flow.
 */
export const DOCUMENT_VERIFICATION_STATUSES = [
  "NOT_REQUIRED",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "REQUIRES_INFO",
] as const

export const documentVerificationStatusSchema = z.enum(
  DOCUMENT_VERIFICATION_STATUSES
)

export type DocumentVerificationStatus = z.infer<
  typeof documentVerificationStatusSchema
>

/**
 * Mirrors `REVIEW_DECISIONS` in the backend's `ReviewDocumentDto`: the only
 * statuses a reviewer may move a document to. `PENDING` and `NOT_REQUIRED`
 * are set by uploads, never by a review.
 */
export const DOCUMENT_REVIEW_DECISIONS = [
  "APPROVED",
  "REJECTED",
  "REQUIRES_INFO",
] as const

export const documentReviewDecisionSchema = z.enum(DOCUMENT_REVIEW_DECISIONS)

export type DocumentReviewDecision = z.infer<typeof documentReviewDecisionSchema>

/**
 * Mirrors `DocumentFileVersionResponseDto`. File metadata lives here rather
 * than on the document: every completed upload creates a new version and the
 * document only points at the current one. Dates arrive as ISO strings.
 */
export const documentFileVersionSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  versionNumber: z.number().int().positive(),
  fileKey: z.string(),
  originalName: z.string().nullable().optional(),
  sizeBytes: z.number().int().nonnegative(),
  contentType: z.string(),
  checksum: z.string().nullable().optional(),
  documentExpiryDate: z.string().nullable().optional(),
  createdAt: z.string().optional(),
})

export type DocumentFileVersion = z.infer<typeof documentFileVersionSchema>

/** Mirrors `DocumentOwnerSummaryDto`; the backend includes it on admin routes only. */
export const documentOwnerSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable().optional(),
})

export type DocumentOwner = z.infer<typeof documentOwnerSchema>

/**
 * Mirrors `DocumentResponseDto`. A document is one user's slot against a
 * requirement; it exists before any file is uploaded, so `currentVersion` is
 * null until the owner completes an upload. `requirement`, `user`, and
 * `currentVersion` are Prisma includes and stay optional so a leaner backend
 * response still parses.
 */
export const documentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  applicationId: z.string().nullable().optional(),
  requirementId: z.string(),
  status: documentVerificationStatusSchema,
  currentVersionId: z.string().nullable().optional(),
  currentVersion: documentFileVersionSchema.nullable().optional(),
  requirement: documentRequirementSchema
    .extend({ documentType: documentTypeSchema })
    .optional(),
  user: documentOwnerSchema.optional(),
  deletedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

/** Named `DocumentRecord` because `Document` is the DOM global. */
export type DocumentRecord = z.infer<typeof documentSchema>

export const documentsPaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
})

export type DocumentsPagination = z.infer<typeof documentsPaginationSchema>

export const paginatedDocumentsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    documents: z.array(documentSchema),
    pagination: documentsPaginationSchema,
  }),
})

export const documentResponseSchema = z.object({
  success: z.literal(true),
  data: documentSchema,
})

/**
 * Mirrors `ReviewDocumentDto`. The backend marks `notes` optional but
 * documents it as required for a rejection or an information request (it is
 * emailed to the owner), so that rule is enforced here before the request
 * reaches the backend. An empty note is dropped rather than sent as `""` so
 * an approval does not record a blank note in the audit log.
 */
export const reviewDocumentInputSchema = z
  .object({
    status: documentReviewDecisionSchema,
    notes: z
      .string()
      .trim()
      .max(2000, "Use 2000 characters or fewer for the notes."),
  })
  .refine(({ status, notes }) => status === "APPROVED" || notes.length > 0, {
    message:
      "Add a note explaining why the document was rejected or what information is required.",
    path: ["notes"],
  })
  .transform(({ status, notes }) => ({
    status,
    ...(notes ? { notes } : {}),
  }))

export type ReviewDocumentInput = z.input<typeof reviewDocumentInputSchema>
