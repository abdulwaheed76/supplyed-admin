import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import {
  createDocumentTypeFormSchema,
  documentTypeSchema,
} from "@/lib/document-types/schema"
import { documentRequirementSchema } from "@/lib/document-requirements/schema"

const createDocumentTypeResponseSchema = z.object({
  success: z.literal(true),
  data: documentTypeSchema,
})

const createDocumentRequirementResponseSchema = z.object({
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
      "Cross-origin document type creation is not allowed.",
      403
    )
  }

  const body: unknown = await request.json().catch(() => null)
  const parsed = createDocumentTypeFormSchema.safeParse(body)

  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message || "The document type details are invalid."

    return errorResponse(message, 400)
  }

  // `requirements` is ours, not the backend's: the document-types DTO would
  // reject it outright under `forbidNonWhitelisted`.
  const { requirements, ...documentTypeInput } = parsed.data

  const result = await adminApiRequest({
    path: "document-types",
    method: "POST",
    body: documentTypeInput,
    schema: createDocumentTypeResponseSchema,
    serviceName: "document types",
    fallbackMessage: "Unable to create the document type.",
  })

  if (!result.ok) {
    // The backend does not map the unique-constraint failure on `code`, so a
    // duplicate surfaces as a 500. Name the real cause rather than passing a
    // bare server error to the admin.
    if (result.status >= 500) {
      return errorResponse(
        `Unable to create the document type. A document type with the code "${parsed.data.code}" may already exist.`,
        result.status
      )
    }

    return errorResponse(result.message, result.status)
  }

  const documentType = result.data.data

  // The backend has no endpoint that creates a type and its requirements
  // together, so this is N+1 writes with no transaction to roll back. A failure
  // part-way leaves the type created but not fully linked, and re-submitting the
  // form would now collide on the unique `code` — so the failure is reported
  // with the code and the exact contexts left over, not as a generic error.
  const failedContexts: string[] = []

  for (const requirement of requirements) {
    const created = await adminApiRequest({
      path: "document-requirements",
      method: "POST",
      body: { documentTypeId: documentType.id, ...requirement },
      schema: createDocumentRequirementResponseSchema,
      serviceName: "document requirements",
      fallbackMessage: "Unable to link the document type to that context.",
    })

    if (!created.ok) {
      failedContexts.push(requirement.context)
    }
  }

  revalidatePath("/dashboard/document-types")

  if (failedContexts.length > 0) {
    return errorResponse(
      `The document type "${documentType.code}" was created, but these contexts could not be applied: ${failedContexts.join(", ")}. Add them from document requirements rather than re-submitting this form.`,
      502
    )
  }

  const nextResponse = NextResponse.json(
    { documentType },
    { status: 201 }
  )
  nextResponse.headers.set("Cache-Control", "private, no-store")

  return nextResponse
}
