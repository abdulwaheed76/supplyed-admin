import "server-only"

import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import { documentTypeSchema, type DocumentType } from "@/lib/document-types/schema"

const documentTypeListSchema = z.array(documentTypeSchema)

/**
 * `GET /document-types` returns a bare array under `data` — the controller has
 * no pagination. The wrapped shapes are accepted too so that adding pagination
 * on the backend does not break this page.
 */
const documentTypesResponseSchema = z.object({
  success: z.literal(true),
  data: z.union([
    documentTypeListSchema,
    z.object({ documentTypes: documentTypeListSchema }),
    z.object({ items: documentTypeListSchema }),
    z.object({ data: documentTypeListSchema }),
  ]),
})

export type GetDocumentTypesResult =
  | { ok: true; documentTypes: DocumentType[] }
  | { ok: false; message: string; status: number }

export async function getDocumentTypes(): Promise<GetDocumentTypesResult> {
  const result = await adminApiRequest({
    path: "document-types",
    schema: documentTypesResponseSchema,
    serviceName: "document types",
    fallbackMessage: "Unable to load document types.",
    debugLabel: "document-types-api",
  })

  if (!result.ok) {
    return result
  }

  const { data } = result.data

  if (Array.isArray(data)) {
    return { ok: true, documentTypes: data }
  }

  if ("documentTypes" in data) {
    return { ok: true, documentTypes: data.documentTypes }
  }

  if ("items" in data) {
    return { ok: true, documentTypes: data.items }
  }

  return { ok: true, documentTypes: data.data }
}
