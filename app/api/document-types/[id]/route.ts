import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import {
  documentTypeSchema,
  updateDocumentTypeInputSchema,
} from "@/lib/document-types/schema"

const documentTypeResponseSchema = z.object({
  success: z.literal(true),
  data: documentTypeSchema,
})

type DocumentTypeRouteContext = {
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

function successResponse(body: unknown) {
  const response = NextResponse.json(body)
  response.headers.set("Cache-Control", "private, no-store")

  return response
}

export async function PATCH(
  request: NextRequest,
  { params }: DocumentTypeRouteContext
) {
  if (!isSameOrigin(request)) {
    return errorResponse("Cross-origin document type updates are not allowed.", 403)
  }

  const id = readId((await params).id)

  if (!id) {
    return errorResponse("The document type ID is invalid.", 400)
  }

  const body: unknown = await request.json().catch(() => null)
  const parsed = updateDocumentTypeInputSchema.safeParse(body)

  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message || "The document type details are invalid."

    return errorResponse(message, 400)
  }

  const result = await adminApiRequest({
    path: `document-types/${id}`,
    method: "PATCH",
    body: parsed.data,
    schema: documentTypeResponseSchema,
    serviceName: "document types",
    fallbackMessage: "Unable to update the document type.",
  })

  if (!result.ok) {
    // Same unmapped unique-constraint failure the create route handles: the
    // backend does not translate a duplicate `code`, so it arrives as a 500.
    if (result.status >= 500 && parsed.data.code) {
      return errorResponse(
        `Unable to update the document type. A document type with the code "${parsed.data.code}" may already exist.`,
        result.status
      )
    }

    return errorResponse(result.message, result.status)
  }

  revalidatePath("/dashboard/document-types")
  revalidatePath(`/dashboard/document-types/${id}/edit`)

  return successResponse({ documentType: result.data.data })
}

export async function DELETE(
  request: NextRequest,
  { params }: DocumentTypeRouteContext
) {
  if (!isSameOrigin(request)) {
    return errorResponse(
      "Cross-origin document type deletion is not allowed.",
      403
    )
  }

  const id = readId((await params).id)

  if (!id) {
    return errorResponse("The document type ID is invalid.", 400)
  }

  const result = await adminApiRequest({
    path: `document-types/${id}`,
    method: "DELETE",
    schema: documentTypeResponseSchema,
    serviceName: "document types",
    fallbackMessage: "Unable to delete the document type.",
  })

  if (!result.ok) {
    // `DocumentRequirement.documentType` is `onDelete: Restrict`, so any type
    // that has ever been linked to a context cannot be deleted — including
    // every type created through this admin, since the create form always
    // writes at least one requirement. The backend's 409 says only "in use",
    // which does not tell an admin what to remove, so name it here.
    if (result.status === 409) {
      return errorResponse(
        "This document type is still linked to one or more contexts, so it cannot be deleted. Remove its document requirements first.",
        409
      )
    }

    return errorResponse(result.message, result.status)
  }

  revalidatePath("/dashboard/document-types")

  return successResponse({ documentType: result.data.data })
}
