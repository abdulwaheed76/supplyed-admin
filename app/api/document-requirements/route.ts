import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import {
  createDocumentRequirementInputSchema,
  documentRequirementSchema,
} from "@/lib/document-requirements/schema"

const documentRequirementResponseSchema = z.object({
  success: z.literal(true),
  data: documentRequirementSchema,
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

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return errorResponse(
      "Cross-origin document requirement creation is not allowed.",
      403
    )
  }

  const body: unknown = await request.json().catch(() => null)
  const parsed = createDocumentRequirementInputSchema.safeParse(body)

  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ||
      "The document requirement details are invalid."

    return errorResponse(message, 400)
  }

  const result = await adminApiRequest({
    path: "document-requirements",
    method: "POST",
    body: parsed.data,
    schema: documentRequirementResponseSchema,
    serviceName: "document requirements",
    fallbackMessage: "Unable to add the document requirement.",
  })

  if (!result.ok) {
    // `@@unique([documentTypeId, context])` is not mapped by the backend, so
    // re-adding a context the type already has arrives as a 500 rather than a
    // conflict.
    if (result.status >= 500) {
      return errorResponse(
        "Unable to add the document requirement. This document type may already be linked to that context.",
        result.status
      )
    }

    return errorResponse(result.message, result.status)
  }

  revalidatePath("/dashboard/document-types")
  revalidatePath(
    `/dashboard/document-types/${encodeURIComponent(parsed.data.documentTypeId)}/edit`
  )

  const response = NextResponse.json(
    { documentRequirement: result.data.data },
    { status: 201 }
  )
  response.headers.set("Cache-Control", "private, no-store")

  return response
}
