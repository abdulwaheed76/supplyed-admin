import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import { getCurrentSession } from "@/lib/auth/session"

/** The backend answers a deletion with `data: null`; only the envelope matters. */
const deleteResponseSchema = z.object({
  success: z.literal(true),
})

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
