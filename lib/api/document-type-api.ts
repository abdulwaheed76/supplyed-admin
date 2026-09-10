import { z } from "zod"

import { routeRequest } from "@/lib/api/route-request"
import {
  documentTypeSchema,
  type CreateDocumentTypeFormInput,
  type DocumentType,
  type UpdateDocumentTypeInput,
} from "@/lib/document-types/schema"

const createDocumentTypeResponseSchema = z.object({
  documentType: documentTypeSchema,
})

export async function createDocumentType(
  input: CreateDocumentTypeFormInput
): Promise<DocumentType> {
  const result = await routeRequest("/api/document-types", {
    body: input,
    schema: createDocumentTypeResponseSchema,
    fallbackMessage: "Unable to create the document type.",
  })

  return result.documentType
}

function documentTypePath(id: string) {
  return `/api/document-types/${encodeURIComponent(id.slice(0, 128))}`
}

export async function updateDocumentType({
  id,
  input,
}: {
  id: string
  input: UpdateDocumentTypeInput
}): Promise<DocumentType> {
  const result = await routeRequest(documentTypePath(id), {
    method: "PATCH",
    body: input,
    schema: createDocumentTypeResponseSchema,
    fallbackMessage: "Unable to update the document type.",
  })

  return result.documentType
}

export async function deleteDocumentType(id: string): Promise<DocumentType> {
  const result = await routeRequest(documentTypePath(id), {
    method: "DELETE",
    schema: createDocumentTypeResponseSchema,
    fallbackMessage: "Unable to delete the document type.",
  })

  return result.documentType
}
