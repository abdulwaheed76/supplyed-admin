import "server-only"

import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import { instructorDocumentSchema } from "@/lib/documents/schema"
import type { DocumentQueueItem } from "@/lib/documents/types"

type DocumentQueuePagination = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
}

export type GetDocumentQueueResult =
  | {
      ok: true
      items: DocumentQueueItem[]
      pagination: DocumentQueuePagination
      unresolvedInstructorCount: number
    }
  | { ok: false; message: string; status: number }

const instructorsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(
    z.object({
      id: z.string(),
      userId: z.string(),
      fullName: z.string(),
    })
  ),
})

const documentsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    documents: z.array(instructorDocumentSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
      hasNextPage: z.boolean(),
    }),
  }),
})

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

  const [documents, instructors] = await Promise.all([
    adminApiRequest({
      path: "documents/all",
      searchParams: { page, limit },
      schema: documentsResponseSchema,
      serviceName: "documents",
      fallbackMessage: "Unable to load the document queue.",
    }),
    adminApiRequest({
      path: "instructors",
      schema: instructorsResponseSchema,
      serviceName: "instructors",
      fallbackMessage: "Unable to load instructors for the document queue.",
    }),
  ])

  if (!documents.ok) {
    return documents
  }

  if (!instructors.ok) {
    return instructors
  }

  const instructorsById = new Map(
    instructors.data.data.map((instructor) => [instructor.id, instructor])
  )
  let unresolvedInstructorCount = 0
  const items = documents.data.data.documents.map((document) => {
    const instructor = instructorsById.get(document.instructorId)

    if (!instructor) {
      unresolvedInstructorCount += 1
    }

    return {
      document,
      instructor: {
        profileId: document.instructorId,
        userId: instructor?.userId ?? null,
        fullName: instructor?.fullName ?? "Unknown instructor",
      },
    }
  })

  return {
    ok: true,
    items,
    pagination: documents.data.data.pagination,
    unresolvedInstructorCount,
  }
}
