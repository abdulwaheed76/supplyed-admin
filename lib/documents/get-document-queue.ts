import "server-only"

import { cookies } from "next/headers"
import { z } from "zod"

import { createAuthApiUrl, getAuthConfig } from "@/lib/auth/config"
import { ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth/session-cookie"
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

const errorResponseSchema = z.object({
  message: z.union([z.string(), z.array(z.string())]),
})

function getErrorMessage(body: unknown, fallback: string) {
  const error = errorResponseSchema.safeParse(body)

  if (!error.success) {
    return fallback
  }

  return Array.isArray(error.data.message)
    ? error.data.message.join(" ")
    : error.data.message
}

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

  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value
  const config = getAuthConfig()

  if (!accessToken) {
    return {
      ok: false,
      message: "Your session has expired. Sign in again.",
      status: 401,
    }
  }

  if (!config) {
    return {
      ok: false,
      message: "The backend API URL is not configured.",
      status: 503,
    }
  }

  const documentsUrl = createAuthApiUrl(config, "documents/all")
  documentsUrl.searchParams.set("page", String(page))
  documentsUrl.searchParams.set("limit", String(limit))
  const requestOptions = {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store" as const,
  }

  let documentsResponse: Response
  let instructorsResponse: Response

  try {
    const responses = await Promise.all([
      fetch(documentsUrl, requestOptions),
      fetch(createAuthApiUrl(config, "instructors"), requestOptions),
    ])

    documentsResponse = responses[0]
    instructorsResponse = responses[1]
  } catch {
    return {
      ok: false,
      message: "The document queue services are unavailable.",
      status: 503,
    }
  }

  const [documentsBody, instructorsBody]: [unknown, unknown] =
    await Promise.all([
      documentsResponse.json().catch(() => null),
      instructorsResponse.json().catch(() => null),
    ])

  if (!documentsResponse.ok) {
    return {
      ok: false,
      message: getErrorMessage(
        documentsBody,
        "Unable to load the document queue."
      ),
      status: documentsResponse.status,
    }
  }

  if (!instructorsResponse.ok) {
    return {
      ok: false,
      message: getErrorMessage(
        instructorsBody,
        "Unable to load instructors for the document queue."
      ),
      status: instructorsResponse.status,
    }
  }

  const documentsResult = documentsResponseSchema.safeParse(documentsBody)
  const instructorsResult = instructorsResponseSchema.safeParse(instructorsBody)

  if (!documentsResult.success || !instructorsResult.success) {
    return {
      ok: false,
      message: "The document queue services returned an invalid response.",
      status: 502,
    }
  }

  const instructorsById = new Map(
    instructorsResult.data.data.map((instructor) => [instructor.id, instructor])
  )
  let unresolvedInstructorCount = 0
  const items = documentsResult.data.data.documents.map((document) => {
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
    pagination: documentsResult.data.data.pagination,
    unresolvedInstructorCount,
  }
}
