import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { createAuthApiUrl, getAuthConfig } from "@/lib/auth/config"
import { ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth/session-cookie"
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

const errorResponseSchema = z.object({
  message: z.union([z.string(), z.array(z.string())]),
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

  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value
  const config = getAuthConfig()

  if (!accessToken) {
    return errorResponse("Your session has expired. Sign in again.", 401)
  }

  if (!config) {
    return errorResponse("The backend API URL is not configured.", 503)
  }

  let response: Response

  try {
    response = await fetch(
      createAuthApiUrl(
        config,
        `instructors/admin/${encodeURIComponent(profileId)}`
      ),
      {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: parsed.data.status }),
        cache: "no-store",
      }
    )
  } catch {
    return errorResponse("The instructors service is unavailable.", 503)
  }

  const responseBody: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const error = errorResponseSchema.safeParse(responseBody)
    const message = error.success
      ? Array.isArray(error.data.message)
        ? error.data.message.join(" ")
        : error.data.message
      : "Unable to update the instructor profile status."

    return errorResponse(message, response.status)
  }

  const result = updateStatusResponseSchema.safeParse(responseBody)

  if (!result.success) {
    return errorResponse(
      "The instructors service returned an invalid response.",
      502
    )
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
