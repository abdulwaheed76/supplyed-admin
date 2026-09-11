import { z } from "zod"

import { routeRequest } from "@/lib/api/route-request"
import {
  documentSchema,
  type DocumentRecord,
  type ReviewDocumentInput,
} from "@/lib/documents/schema"

const documentResponseSchema = z.object({
  document: documentSchema,
})

export async function reviewDocument({
  id,
  input,
}: {
  id: string
  input: ReviewDocumentInput
}): Promise<DocumentRecord> {
  const result = await routeRequest(
    `/api/documents/${encodeURIComponent(id.slice(0, 128))}/review`,
    {
      body: input,
      schema: documentResponseSchema,
      fallbackMessage: "Unable to save the document review.",
    }
  )

  return result.document
}
