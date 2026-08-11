import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
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

  const result = await adminApiRequest({
    path: `documents/${encodeURIComponent(documentId)}/review`,
    method: "PATCH",
    body: {
      status: parsed.data.status,
      reviewNotes: parsed.data.reviewNotes,
    },
    schema: documentResponseSchema,
    serviceName: "documents",
    fallbackMessage: "Unable to update the document status.",
  })

  if (!result.ok) {
    return errorResponse(result.message, result.status)
  }

  revalidatePath(`/dashboard/users/${encodeURIComponent(parsed.data.userId)}`)
  revalidatePath("/dashboard/document-queue")

  const nextResponse = NextResponse.json({ document: result.data.data })
  nextResponse.headers.set("Cache-Control", "private, no-store")

  return nextResponse
}
