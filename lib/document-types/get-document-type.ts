import "server-only"

import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import {
  documentTypeSchema,
  type DocumentType,
} from "@/lib/document-types/schema"

/** `GET /document-types/:id` returns the row directly under `data`. */
const documentTypeResponseSchema = z.object({
  success: z.literal(true),
  data: documentTypeSchema,
})

export type GetDocumentTypeResult =
  | { ok: true; documentType: DocumentType }
  | { ok: false; message: string; status: number }

export async function getDocumentType(
  id: string
): Promise<GetDocumentTypeResult> {
  const result = await adminApiRequest({
    path: `document-types/${encodeURIComponent(id.slice(0, 128))}`,
    schema: documentTypeResponseSchema,
    serviceName: "document types",
    fallbackMessage: "Unable to load the document type.",
  })

  if (!result.ok) {
    return result
  }

  return { ok: true, documentType: result.data.data }
}
