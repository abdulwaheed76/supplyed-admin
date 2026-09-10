import { z } from "zod"

import { routeRequest } from "@/lib/api/route-request"
import {
  documentRequirementSchema,
  type CreateDocumentRequirementInput,
  type DocumentRequirement,
  type UpdateDocumentRequirementInput,
} from "@/lib/document-requirements/schema"

const documentRequirementResponseSchema = z.object({
  documentRequirement: documentRequirementSchema,
})

function documentRequirementPath(id: string) {
  return `/api/document-requirements/${encodeURIComponent(id.slice(0, 128))}`
}

export async function createDocumentRequirement(
  input: CreateDocumentRequirementInput
): Promise<DocumentRequirement> {
  const result = await routeRequest("/api/document-requirements", {
    body: input,
    schema: documentRequirementResponseSchema,
    fallbackMessage: "Unable to add the document requirement.",
  })

  return result.documentRequirement
}

export async function updateDocumentRequirement({
  id,
  input,
}: {
  id: string
  input: UpdateDocumentRequirementInput
}): Promise<DocumentRequirement> {
  const result = await routeRequest(documentRequirementPath(id), {
    method: "PATCH",
    body: input,
    schema: documentRequirementResponseSchema,
    fallbackMessage: "Unable to update the document requirement.",
  })

  return result.documentRequirement
}

export async function deleteDocumentRequirement(
  id: string
): Promise<DocumentRequirement> {
  const result = await routeRequest(documentRequirementPath(id), {
    method: "DELETE",
    fallbackMessage: "Unable to remove the document requirement.",
    schema: documentRequirementResponseSchema,
  })

  return result.documentRequirement
}
