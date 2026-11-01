import "server-only"

import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import { documentRequirementSchema } from "@/lib/document-requirements/schema"
import { documentTypeSchema } from "@/lib/document-types/schema"
import {
  paginatedDocumentsResponseSchema,
  type DocumentRecord,
} from "@/lib/documents/schema"
import type { UserListItem } from "@/lib/users/schema"

const profileContext: Record<string, string> = {
  INSTRUCTOR: "INSTRUCTOR_PROFILE",
  INSTITUTION: "INSTITUTION_PROFILE",
}

const response = <T,>(item: z.ZodType<T>) =>
  z.object({ success: z.literal(true), data: z.array(item) })

/** The backend has no per-user admin document filter, so read the queue once per users page. */
export async function getVerifiedUserIds(users: UserListItem[], knownDocuments?: DocumentRecord[]) {
  const candidates = users.filter(
    (user) =>
      user.emailVerified &&
      user.phoneVerified &&
      user.profileStatus === "ACTIVE" &&
      Boolean(profileContext[user.role])
  )
  const verified = new Set<string>()
  if (candidates.length === 0) return verified

  const [requirementsResult, typesResult] = await Promise.all([
    adminApiRequest({
      path: "document-requirements",
      schema: response(documentRequirementSchema),
      serviceName: "document requirements",
    }),
    adminApiRequest({
      path: "document-types",
      schema: response(documentTypeSchema),
      serviceName: "document types",
    }),
  ])
  if (!requirementsResult.ok || !typesResult.ok) return verified

  const activeTypes = new Set(
    typesResult.data.data.filter((type) => type.isActive).map((type) => type.id)
  )
  const requirements = requirementsResult.data.data.filter(
    (requirement) =>
      requirement.isActive && activeTypes.has(requirement.documentTypeId)
  )
  const candidateIds = new Set(candidates.map((user) => user.id))
  const documents = new Map<string, DocumentRecord>()
  let page = 1
  let totalPages = 1

  do {
    let batch = knownDocuments
    if (!batch) {
      const result = await adminApiRequest({
        path: "documents/admin",
        searchParams: { page, limit: 100 },
        schema: paginatedDocumentsResponseSchema,
        serviceName: "documents",
      })
      if (!result.ok) return verified
      batch = result.data.data.documents
      totalPages = result.data.data.pagination.totalPages
    }

    for (const document of batch) {
      if (
        !candidateIds.has(document.userId) ||
        document.applicationId ||
        document.deletedAt
      ) continue

      const key = document.userId + ":" + document.requirementId
      const previous = documents.get(key)
      if (!previous || (document.uploadedAt ?? "") > (previous.uploadedAt ?? "")) {
        documents.set(key, document)
      }
    }
    page += 1
  } while (!knownDocuments && page <= totalPages)

  for (const user of candidates) {
    const ownRequirements = requirements.filter(
      (requirement) => requirement.context === profileContext[user.role]
    )
    const allApproved = ownRequirements.every((requirement) => {
      const document = documents.get(user.id + ":" + requirement.id)
      if (!document?.uploadedAt) return !requirement.isRequired
      return (
        document.status === "APPROVED" ||
        (document.status === "NOT_REQUIRED" && !requirement.requiresReview)
      )
    })
    if (allApproved) verified.add(user.id)
  }

  return verified
}
