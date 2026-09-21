import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import { getCurrentSession } from "@/lib/auth/session"
import { userSchema } from "@/lib/users/schema"

/** The backend answers a deletion with `data: null`; only the envelope matters. */
const deleteResponseSchema = z.object({
  success: z.literal(true),
})

const updateResponseSchema = z.object({
  success: z.literal(true),
  data: userSchema,
})

const adminUserRoleSchema = z.enum([
  "USER",
  "INSTRUCTOR",
  "INSTITUTION",
  "RECRUITER",
  "ADMIN",
])

const updateUserInputSchema = z
  .object({
    name: z.string().trim().max(160).optional(),
    phone: z.string().trim().max(40).optional(),
    role: adminUserRoleSchema.optional(),
    emailVerified: z.boolean().optional(),
    phoneVerified: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.phone !== undefined ||
      value.role !== undefined ||
      value.emailVerified !== undefined ||
      value.phoneVerified !== undefined,
    {
      message: "Provide at least one user detail to update.",
    }
  )

const userIdSchema = z.uuid()

type UserRouteContext = {
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

export async function DELETE(
  request: NextRequest,
  { params }: UserRouteContext
) {
  if (!isSameOrigin(request)) {
    return errorResponse("Cross-origin user deletion is not allowed.", 403)
  }

  // The backend validates the ID with `ParseUUIDPipe`; checking here turns
  // the pipe's "uuid is expected" into a message written for an admin.
  const parsedId = userIdSchema.safeParse((await params).id.trim())

  if (!parsedId.success) {
    return errorResponse("The user ID is invalid.", 400)
  }

  const id = parsedId.data

  // The backend does not stop an admin deleting themselves, and its JWT
  // strategy rejects tokens for accounts that no longer exist, so a
  // self-delete would succeed and then lock this session out on the next
  // request. Refuse it before it reaches the backend.
  const session = await getCurrentSession()

  if (session?.id === id) {
    return errorResponse("You cannot delete your own account.", 400)
  }

  const result = await adminApiRequest({
    path: `users/admin/${encodeURIComponent(id)}`,
    method: "DELETE",
    schema: deleteResponseSchema,
    serviceName: "users",
    fallbackMessage: "Unable to delete the user.",
  })

  if (!result.ok) {
    // Jobs, documents, and document reviews restrict deletion of their owner.
    // The backend's 409 says only "related records", which does not tell an
    // admin what to remove, so name them here.
    if (result.status === 409) {
      return errorResponse(
        "This user still owns jobs, documents, or document reviews, so they cannot be deleted. Remove those records first.",
        409
      )
    }

    return errorResponse(result.message, result.status)
  }

  revalidatePath("/dashboard/users")
  revalidatePath(`/dashboard/users/${encodeURIComponent(id)}`)

  const response = NextResponse.json({ id })
  response.headers.set("Cache-Control", "private, no-store")

  return response
}

export async function PATCH(
  request: NextRequest,
  { params }: UserRouteContext
) {
  if (!isSameOrigin(request)) {
    return errorResponse("Cross-origin user updates are not allowed.", 403)
  }

  const parsedId = userIdSchema.safeParse((await params).id.trim())

  if (!parsedId.success) {
    return errorResponse("The user ID is invalid.", 400)
  }

  const parsedBody = updateUserInputSchema.safeParse(
    await request.json().catch(() => null)
  )

  if (!parsedBody.success) {
    return errorResponse(
      parsedBody.error.issues[0]?.message ?? "The user details are invalid.",
      400
    )
  }

  const id = parsedId.data
  const result = await adminApiRequest({
    path: `users/admin/${encodeURIComponent(id)}`,
    method: "PATCH",
    body: parsedBody.data,
    schema: updateResponseSchema,
    serviceName: "users",
    fallbackMessage: "Unable to update the user.",
  })

  if (!result.ok) {
    const message = result.status === 400 && /property .* should not exist/i.test(result.message)
      ? "This backend server is running an older build without verification updates. Restart it and try again."
      : result.message
    return errorResponse(message, result.status)
  }

  revalidatePath("/dashboard/users")
  revalidatePath(`/dashboard/users/${encodeURIComponent(id)}`)

  const response = NextResponse.json({ user: result.data.data })
  response.headers.set("Cache-Control", "private, no-store")

  return response
}