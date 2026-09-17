import "server-only"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import {
  documentReviewsResponseSchema,
  type DocumentReviewComment,
  type DocumentReviewRecord,
} from "@/lib/document-reviews/schema"

export type GetDocumentReviewsResult =
  | { ok: true; reviews: DocumentReviewRecord[] }
  | { ok: false; message: string; status: number }

export async function getDocumentReviews(
  documentId: string
): Promise<GetDocumentReviewsResult> {
  const normalizedDocumentId = documentId.trim()

  if (!normalizedDocumentId || normalizedDocumentId.length > 128) {
    return {
      ok: false,
      message: "The document ID is invalid.",
      status: 400,
    }
  }

  const result = await adminApiRequest({
    path: "document-reviews",
    searchParams: { documentId: normalizedDocumentId },
    schema: documentReviewsResponseSchema,
    serviceName: "document reviews",
    fallbackMessage: "Unable to load document review comments.",
  })

  if (!result.ok) {
    return result
  }

  return { ok: true, reviews: result.data.data }
}

export function getLatestDocumentReviewComment(
  reviews: DocumentReviewRecord[]
): DocumentReviewComment | null {
  const review = [...reviews]
    .filter(
      (item) =>
        (item.toStatus === "REJECTED" || item.toStatus === "REQUIRES_INFO") &&
        item.notes?.trim()
    )
    .sort(
      (a, b) =>
        Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? "")
    )[0]

  if (!review?.notes?.trim()) {
    return null
  }

  return {
    id: review.id,
    toStatus: review.toStatus,
    notes: review.notes.trim(),
    createdAt: review.createdAt,
  }
}