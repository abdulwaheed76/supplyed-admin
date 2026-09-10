import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import {
  documentRequirementSchema,
  updateDocumentRequirementInputSchema,
} from "@/lib/document-requirements/schema"

const documentRequirementResponseSchema = z.object({
  success: z.literal(true),
  data: documentRequirementSchema,
})

type DocumentRequirementRouteContext = {
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
 * The edit screen is keyed by document type, not requirement, so both handlers
 * revalidate that page. The id is not in the path, so it comes from the
 * response the backend just returned.
 */
function revalidateFor(documentTypeId: string) {
  revalidatePath("/dashboard/document-types")
  revalidatePath(
    `/dashboard/document-types/${encodeURIComponent(documentTypeId)}/edit`
  )
}

function successResponse(body: unknown) {
  const response = NextResponse.json(body)
  response.headers.set("Cache-Control", "private, no-store")

  return response
}

export async function PATCH(
  request: NextRequest,
  { params }: DocumentRequirementRouteContext
) {
  if (!isSameOrigin(request)) {
    return errorResponse(
      "Cross-origin document requirement updates are not allowed.",
      403
    )
  }

  const id = readId((await params).id)

  if (!id) {
    return errorResponse("The document requirement ID is invalid.", 400)
  }

  const body: unknown = await request.json().catch(() => null)
  const parsed = updateDocumentRequirementInputSchema.safeParse(body)

  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ||
      "The document requirement details are invalid."

    return errorResponse(message, 400)
  }

  const result = await adminApiRequest({
    path: `document-requirements/${id}`,
    method: "PATCH",
    body: parsed.data,
    schema: documentRequirementResponseSchema,
    serviceName: "document requirements",
    fallbackMessage: "Unable to update the document requirement.",
  })

  if (!result.ok) {
    return errorResponse(result.message, result.status)
  }

  revalidateFor(result.data.data.documentTypeId)

  return successResponse({ documentRequirement: result.data.data })
}

export async function DELETE(
  request: NextRequest,
  { params }: DocumentRequirementRouteContext
) {
  if (!isSameOrigin(request)) {
    return errorResponse(
      "Cross-origin document requirement deletion is not allowed.",
      403
    )
  }

  const id = readId((await params).id)

  if (!id) {
    return errorResponse("The document requirement ID is invalid.", 400)
  }

  const result = await adminApiRequest({
    path: `document-requirements/${id}`,
    method: "DELETE",
    schema: documentRequirementResponseSchema,
    serviceName: "document requirements",
    fallbackMessage: "Unable to remove the document requirement.",
  })

  if (!result.ok) {
    // Both `Documents.requirement` and `JobDocumentRequirement.requirement` are
    // `onDelete: Restrict`, so a requirement anyone has uploaded against — or
    // that a job asks for — cannot be removed. The backend's 409 says only
    // "in use", which does not tell an admin which of the two it is.
    if (result.status === 409) {
      return errorResponse(
        "This context cannot be removed: documents have been uploaded against it, or a job still requires it. Deactivate it instead.",
        409
      )
    }

    return errorResponse(result.message, result.status)
  }

  revalidateFor(result.data.data.documentTypeId)

  return successResponse({ documentRequirement: result.data.data })
}
