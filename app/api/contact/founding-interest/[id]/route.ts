import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import { getCurrentSession } from "@/lib/auth/session"
import { submissionResponseSchema } from "@/lib/waiting-list/schema"

type SubmissionRouteContext = {
  params: Promise<{ id: string }>
}

const submissionIdSchema = z.string().trim().min(1).max(128)

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "private, no-store" } }
  )
}

export async function DELETE(
  request: NextRequest,
  { params }: SubmissionRouteContext
) {
  const origin = request.headers.get("origin")

  if (origin && origin !== request.nextUrl.origin) {
    return errorResponse("Cross-origin submission deletion is not allowed.", 403)
  }

  const session = await getCurrentSession()

  if (!session) {
    return errorResponse("Your session has expired. Sign in again.", 401)
  }

  const parsedId = submissionIdSchema.safeParse((await params).id)

  if (!parsedId.success) {
    return errorResponse("The submission ID is invalid.", 400)
  }

  const result = await adminApiRequest({
    path: `contact/founding-interest/${encodeURIComponent(parsedId.data)}`,
    method: "DELETE",
    schema: submissionResponseSchema,
    serviceName: "waiting list",
    fallbackMessage: "Unable to delete the submission.",
  })

  if (!result.ok) {
    return errorResponse(result.message, result.status)
  }

  revalidatePath("/dashboard/waiting-list")

  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "private, no-store" },
  })
}
