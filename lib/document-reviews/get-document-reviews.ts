import "server-only"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import type { DocumentRecord } from "@/lib/documents/schema"
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
  reviews: DocumentReviewRecord[],
  document: Pick<DocumentRecord, "id" | "fileKey" | "status">
): DocumentReviewComment | null {
  if (!document.fileKey || !["REJECTED", "REQUIRES_INFO"].includes(document.status)) return null
  const review = [...reviews]
    .filter(
      (item) =>
        item.documentId === document.id &&
        item.reviewedFileKey === document.fileKey &&
        item.toStatus === document.status &&
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
