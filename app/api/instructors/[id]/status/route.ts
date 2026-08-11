import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import {
  adminProfileStatusSchema,
  profileStatusSchema,
} from "@/lib/users/profile-status-schema"

type InstructorStatusRouteContext = {
  params: Promise<{ id: string }>
}

const updateStatusInputSchema = z.object({
  userId: z.string().trim().min(1).max(128),
  status: adminProfileStatusSchema,
})

const updateStatusResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string(),
    status: profileStatusSchema,
  }),
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
  { params }: InstructorStatusRouteContext
) {
  if (!isSameOrigin(request)) {
    return errorResponse("Cross-origin status updates are not allowed.", 403)
  }

  const profileId = (await params).id.trim()

  if (!profileId || profileId.length > 128) {
    return errorResponse("The instructor profile ID is invalid.", 400)
  }

  const body: unknown = await request.json().catch(() => null)
  const parsed = updateStatusInputSchema.safeParse(body)

  if (!parsed.success) {
    return errorResponse("The instructor status details are invalid.", 400)
  }

  const result = await adminApiRequest({
    path: `instructors/admin/${encodeURIComponent(profileId)}`,
    method: "PATCH",
    body: { status: parsed.data.status },
    schema: updateStatusResponseSchema,
    serviceName: "instructors",
    fallbackMessage: "Unable to update the instructor profile status.",
  })

  if (!result.ok) {
    return errorResponse(result.message, result.status)
  }

  revalidatePath(`/dashboard/users/${encodeURIComponent(parsed.data.userId)}`)
  revalidatePath("/dashboard/users")

  const nextResponse = NextResponse.json({
    profileId: result.data.data.id,
    status: result.data.data.status,
  })
  nextResponse.headers.set("Cache-Control", "private, no-store")

  return nextResponse
}
