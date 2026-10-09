import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import { getCurrentSession } from "@/lib/auth/session"
import {
  submissionResponseSchema,
  submissionStatusSchema,
} from "@/lib/waiting-list/schema"

type SubmissionStatusRouteContext = {
  params: Promise<{ id: string }>
}

const submissionIdSchema = z.string().trim().min(1).max(128)
const updateStatusInputSchema = z.object({ status: submissionStatusSchema })

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "private, no-store" } }
  )
}

export async function PATCH(
  request: NextRequest,
  { params }: SubmissionStatusRouteContext
) {
  const origin = request.headers.get("origin")

  if (origin && origin !== request.nextUrl.origin) {
    return errorResponse("Cross-origin status updates are not allowed.", 403)
  }

  const session = await getCurrentSession()

  if (!session) {
    return errorResponse("Your session has expired. Sign in again.", 401)
  }

  const parsedId = submissionIdSchema.safeParse((await params).id)

  if (!parsedId.success) {
    return errorResponse("The submission ID is invalid.", 400)
  }

  const body: unknown = await request.json().catch(() => null)
  const parsed = updateStatusInputSchema.safeParse(body)

  if (!parsed.success) {
    return errorResponse(
      parsed.error.issues[0]?.message ?? "The submission status is invalid.",
      400
    )
  }

  const result = await adminApiRequest({
    path: `contact/founding-interest/${encodeURIComponent(parsedId.data)}/status`,
    method: "PATCH",
    body: { status: parsed.data.status },
    schema: submissionResponseSchema,
    serviceName: "waiting list",
    fallbackMessage: "Unable to update the submission status.",
  })

  if (!result.ok) {
    return errorResponse(result.message, result.status)
  }

  revalidatePath("/dashboard/waiting-list")

  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "private, no-store" },
  })
}
