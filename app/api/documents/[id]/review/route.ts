import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import {
  documentResponseSchema,
  reviewDocumentInputSchema,
} from "@/lib/documents/schema"

type ReviewDocumentRouteContext = {
  params: Promise<{ id: string }>
}

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

function readId(rawId: string) {
  const id = rawId.trim().slice(0, 128)

  return id ? encodeURIComponent(id) : null
}

/**
 * Forwards to `POST /documents/admin/:id/review`. A review is an append-only
 * audit row on the backend, which is why this is a POST and not a PATCH on the
 * document: the caller decides an outcome for the current file version rather
 * than editing fields on the document.
 */
export async function POST(
  request: NextRequest,
  { params }: ReviewDocumentRouteContext
) {
  if (!isSameOrigin(request)) {
    return errorResponse("Cross-origin document reviews are not allowed.", 403)
  }

  const id = readId((await params).id)

  if (!id) {
    return errorResponse("The document ID is invalid.", 400)
  }

  const body: unknown = await request.json().catch(() => null)
  const parsed = reviewDocumentInputSchema.safeParse(body)

  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message || "The document review details are invalid."

    return errorResponse(message, 400)
  }

  const result = await adminApiRequest({
    path: `documents/admin/${id}/review`,
    method: "POST",
    body: parsed.data,
    schema: documentResponseSchema,
    serviceName: "documents",
    fallbackMessage: "Unable to save the document review.",
  })

  if (!result.ok) {
    return errorResponse(result.message, result.status)
  }

  const document = result.data.data

  revalidatePath("/dashboard/document-queue")
  revalidatePath(
    `/dashboard/users/${encodeURIComponent(document.userId)}/documents/${id}`
  )

  const response = NextResponse.json({ document })
  response.headers.set("Cache-Control", "private, no-store")

  return response
}
