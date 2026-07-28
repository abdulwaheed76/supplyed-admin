import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { createAuthApiUrl, getAuthConfig } from "@/lib/auth/config"
import { ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth/session-cookie"
import {
  documentResponseSchema,
  documentReviewStatusSchema,
} from "@/lib/documents/schema"

type ReviewDocumentRouteContext = {
  params: Promise<{ id: string }>
}

const reviewDocumentInputSchema = z.object({
  userId: z.string().trim().min(1).max(128),
  status: documentReviewStatusSchema,
  reviewNotes: z.string().trim().max(1000),
})

const errorResponseSchema = z.object({
  message: z.union([z.string(), z.array(z.string())]),
})

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "private, no-store" } }
  )
}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")

  return !origin || origin === request.nextUrl.origin
}

export async function PATCH(
  request: NextRequest,
  { params }: ReviewDocumentRouteContext
) {
  if (!isSameOrigin(request)) {
    return errorResponse("Cross-origin review requests are not allowed.", 403)
  }

  const documentId = (await params).id.trim()

  if (!documentId || documentId.length > 128) {
    return errorResponse("The document ID is invalid.", 400)
  }

  const body: unknown = await request.json().catch(() => null)
  const parsed = reviewDocumentInputSchema.safeParse(body)

  if (!parsed.success) {
    return errorResponse("The document review details are invalid.", 400)
  }

  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value
  const config = getAuthConfig()

  if (!accessToken) {
    return errorResponse("Your session has expired. Sign in again.", 401)
  }

  if (!config) {
    return errorResponse("The backend API URL is not configured.", 503)
  }

  let response: Response

  try {
    response = await fetch(
      createAuthApiUrl(
        config,
        `documents/${encodeURIComponent(documentId)}/review`
      ),
      {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: parsed.data.status,
          reviewNotes: parsed.data.reviewNotes,
        }),
        cache: "no-store",
      }
    )
  } catch {
    return errorResponse("The documents service is unavailable.", 503)
  }

  const responseBody: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const error = errorResponseSchema.safeParse(responseBody)
    const message = error.success
      ? Array.isArray(error.data.message)
        ? error.data.message.join(" ")
        : error.data.message
      : "Unable to update the document status."

    return errorResponse(message, response.status)
  }

  const result = documentResponseSchema.safeParse(responseBody)

  if (!result.success) {
    return errorResponse(
      "The documents service returned an invalid response.",
      502
    )
  }

  revalidatePath(`/dashboard/users/${encodeURIComponent(parsed.data.userId)}`)
  revalidatePath("/dashboard/document-queue")

  const nextResponse = NextResponse.json({ document: result.data.data })
  nextResponse.headers.set("Cache-Control", "private, no-store")

  return nextResponse
}
