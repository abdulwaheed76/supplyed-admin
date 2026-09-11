import "server-only"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import {
  documentResponseSchema,
  type DocumentRecord,
} from "@/lib/documents/schema"

export type GetDocumentResult =
  | { ok: true; document: DocumentRecord }
  | { ok: false; message: string; status: number }

export async function getDocument(
  documentId: string
): Promise<GetDocumentResult> {
  const normalizedDocumentId = documentId.trim()

  if (!normalizedDocumentId || normalizedDocumentId.length > 128) {
    return { ok: false, message: "The document ID is invalid.", status: 400 }
  }

  const result = await adminApiRequest({
    path: `documents/admin/${encodeURIComponent(normalizedDocumentId)}`,
    schema: documentResponseSchema,
    serviceName: "documents",
    fallbackMessage: "Unable to load this document.",
  })

  if (!result.ok) {
    return result
  }

  return { ok: true, document: result.data.data }
}
