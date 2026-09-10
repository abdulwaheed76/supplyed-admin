import "server-only"

import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import {
  documentRequirementSchema,
  type DocumentRequirement,
} from "@/lib/document-requirements/schema"

const documentRequirementListSchema = z.array(documentRequirementSchema)

/**
 * `GET /document-requirements` returns a bare array under `data`. The wrapped
 * shapes are accepted too so that adding pagination on the backend does not
 * break this page.
 */
const documentRequirementsResponseSchema = z.object({
  success: z.literal(true),
  data: z.union([
    documentRequirementListSchema,
    z.object({ documentRequirements: documentRequirementListSchema }),
    z.object({ items: documentRequirementListSchema }),
    z.object({ data: documentRequirementListSchema }),
  ]),
})

export type GetDocumentRequirementsResult =
  | { ok: true; requirements: DocumentRequirement[] }
  | { ok: false; message: string; status: number }

function unwrap(
  data: z.infer<typeof documentRequirementsResponseSchema>["data"]
) {
  if (Array.isArray(data)) {
    return data
  }

  if ("documentRequirements" in data) {
    return data.documentRequirements
  }

  if ("items" in data) {
    return data.items
  }

  return data.data
}

/**
 * The controller's `findAll` takes no filter — it returns every requirement on
 * the platform — so narrowing to one document type happens here. If the list
 * ever grows enough for that to matter, the fix is a query parameter on the
 * backend, not pagination here.
 */
export async function getDocumentRequirements(
  documentTypeId?: string
): Promise<GetDocumentRequirementsResult> {
  const result = await adminApiRequest({
    path: "document-requirements",
    schema: documentRequirementsResponseSchema,
    serviceName: "document requirements",
    fallbackMessage: "Unable to load document requirements.",
  })

  if (!result.ok) {
    return result
  }

  const requirements = unwrap(result.data.data)

  return {
    ok: true,
    requirements: documentTypeId
      ? requirements.filter(
          (requirement) => requirement.documentTypeId === documentTypeId
        )
      : requirements,
  }
}
