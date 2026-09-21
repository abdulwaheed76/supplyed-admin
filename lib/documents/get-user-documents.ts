import "server-only"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import {
  getDocumentReviews,
  getLatestDocumentReviewComment,
} from "@/lib/document-reviews/get-document-reviews"
import type { DocumentReviewComment } from "@/lib/document-reviews/schema"
import {
  paginatedDocumentsResponseSchema,
  type DocumentRecord,
} from "@/lib/documents/schema"

const PAGE_LIMIT = 100

export type GetUserDocumentsResult =
  | {
      ok: true
      documents: DocumentRecord[]
      total: number
      reviewComments: Record<string, DocumentReviewComment | null>
    }
  | { ok: false; message: string; status: number }

async function getReviewComments(documents: DocumentRecord[]) {
  const entries = await Promise.all(
    documents.map(async (document) => {
      const result = await getDocumentReviews(document.id)

      return [
        document.id,
        result.ok ? getLatestDocumentReviewComment(result.reviews) : null,
      ] as const
    })
  )

  return Object.fromEntries(entries)
}

/**
 * The backend currently exposes admin document pagination through the same
 * endpoint as the review queue: `GET /documents/admin`. It does not expose a
 * userId query filter, so the admin app walks the queue pages and narrows the
 * result to the selected owner locally.
 */
export async function getUserDocuments(
  userId: string
): Promise<GetUserDocumentsResult> {
  const normalizedUserId = userId.trim()

  if (!normalizedUserId || normalizedUserId.length > 128) {
    return {
      ok: false,
      message: "The user ID is invalid.",
      status: 400,
    }
  }

  const documents: DocumentRecord[] = []
  let page = 1
  let total = 0
  let totalPages = 1

  do {
    const result = await adminApiRequest({
      path: "documents/admin",
      searchParams: { page, limit: PAGE_LIMIT },
      schema: paginatedDocumentsResponseSchema,
      serviceName: "documents",
      fallbackMessage: "Unable to load this user's documents.",
    })

    if (!result.ok) {
      return result
    }

    const pageData = result.data.data

    total = pageData.pagination.total
    totalPages = Math.max(pageData.pagination.totalPages, 1)
    documents.push(
      ...pageData.documents.filter(
        (document) => document.userId === normalizedUserId
      )
    )
    page += 1
  } while (page <= totalPages)

  return {
    ok: true,
    documents,
    total,
    reviewComments: await getReviewComments(documents),
  }
}