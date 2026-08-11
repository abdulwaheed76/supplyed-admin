import "server-only"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import { instructorDocumentsResponseSchema } from "@/lib/documents/schema"
import type { InstructorDocument } from "@/lib/documents/types"

export type GetInstructorDocumentsResult =
  | { ok: true; documents: InstructorDocument[] }
  | { ok: false; message: string; status: number }

export async function getInstructorDocuments(
  userId: string
): Promise<GetInstructorDocumentsResult> {
  const normalizedUserId = userId.trim()

  if (!normalizedUserId || normalizedUserId.length > 128) {
    return { ok: false, message: "The user ID is invalid.", status: 400 }
  }

  const result = await adminApiRequest({
    path: `documents/user/${encodeURIComponent(normalizedUserId)}`,
    schema: instructorDocumentsResponseSchema,
    serviceName: "documents",
    fallbackMessage: "Unable to load this instructor's documents.",
  })

  if (!result.ok) {
    return result
  }

  return { ok: true, documents: result.data.data }
}
