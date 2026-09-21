import { z } from "zod"

import { documentVerificationStatusSchema } from "@/lib/documents/schema"

export const documentReviewSchema = z.object({
  id: z.string(),
  fileVersionId: z.string(),
  reviewerId: z.string(),
  fromStatus: documentVerificationStatusSchema,
  toStatus: documentVerificationStatusSchema,
  notes: z.string().nullable().optional(),
  createdAt: z.string().optional(),
})

export type DocumentReviewRecord = z.infer<typeof documentReviewSchema>

export const documentReviewsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(documentReviewSchema),
})

export type DocumentReviewComment = {
  id: string
  toStatus: DocumentReviewRecord["toStatus"]
  notes: string
  createdAt?: string
}