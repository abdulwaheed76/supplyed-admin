import "server-only"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import {
  paginatedDocumentsResponseSchema,
  type DocumentRecord,
  type DocumentsPagination,
} from "@/lib/documents/schema"

export type GetDocumentQueueResult =
  | { ok: true; documents: DocumentRecord[]; pagination: DocumentsPagination }
  | { ok: false; message: string; status: number }

/**
 * `GET /documents/admin` includes the owner, the requirement with its
 * document type, and the current file version on every row, so the queue no
 * longer needs a second request to name the uploader. Documents belong to
 * users of any role now, not only instructors.
 */
export async function getDocumentQueue({
  page,
  limit,
}: {
  page: number
  limit: number
}): Promise<GetDocumentQueueResult> {
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    return {
      ok: false,
      message: "The document pagination values are invalid.",
      status: 400,
    }
  }

  const result = await adminApiRequest({
    path: "documents/admin",
    searchParams: { page, limit },
    schema: paginatedDocumentsResponseSchema,
    serviceName: "documents",
    fallbackMessage: "Unable to load the document queue.",
  })

  if (!result.ok) {
    return result
  }

  return {
    ok: true,
    documents: result.data.data.documents,
    pagination: result.data.data.pagination,
  }
}
