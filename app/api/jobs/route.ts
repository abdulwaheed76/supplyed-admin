import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import { createJobInputSchema, jobSchema } from "@/lib/jobs/schema"

const createJobResponseSchema = z.object({
  success: z.literal(true),
  data: jobSchema,
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
    return errorResponse("Cross-origin job creation is not allowed.", 403)
  }

  const body: unknown = await request.json().catch(() => null)
  const parsed = createJobInputSchema.safeParse(body)

  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message || "The job details are invalid."

    return errorResponse(message, 400)
  }

  const result = await adminApiRequest({
    path: "jobs",
    method: "POST",
    body: parsed.data,
    schema: createJobResponseSchema,
    serviceName: "jobs",
    fallbackMessage: "Unable to create the job.",
  })

  if (!result.ok) {
    return errorResponse(result.message, result.status)
  }

  revalidatePath("/dashboard/jobs")

  const nextResponse = NextResponse.json(
    { job: result.data.data },
    { status: 201 }
  )
  nextResponse.headers.set("Cache-Control", "private, no-store")

  return nextResponse
}
