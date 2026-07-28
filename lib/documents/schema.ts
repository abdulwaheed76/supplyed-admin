import { z } from "zod"

import {
  DOCUMENT_CONTENT_TYPES,
  DOCUMENT_REVIEW_STATUSES,
  DOCUMENT_TYPES,
} from "@/lib/documents/types"

export const documentReviewStatusSchema = z.enum(DOCUMENT_REVIEW_STATUSES)
export const documentTypeSchema = z.enum(DOCUMENT_TYPES)
export const documentContentTypeSchema = z.enum(DOCUMENT_CONTENT_TYPES)

export const instructorDocumentSchema = z.object({
  id: z.string(),
  instructorId: z.string(),
  name: z.string(),
  type: documentTypeSchema,
  contentType: documentContentTypeSchema,
  sizeBytes: z.number().nonnegative(),
  uploadedAt: z.string().nullable().optional(),
  status: documentReviewStatusSchema,
  reviewNotes: z.string().nullable().optional(),
  dbsNumber: z.string().nullable().optional(),
  dbsIssueDate: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export const instructorDocumentsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(instructorDocumentSchema),
})

export const documentResponseSchema = z.object({
  success: z.literal(true),
  data: instructorDocumentSchema,
})
