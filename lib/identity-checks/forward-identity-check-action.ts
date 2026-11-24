import "server-only"

import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import { identityCheckResponseSchema } from "@/lib/identity-checks/schema"

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

/**
 * The reissue, retry and decision route handlers differ only in the backend
 * action, wording and body, so they share this: same-origin check, forward the
 * POST, refresh the identity-check pages, and return the updated check. A body
 * is passed only once the route handler has validated it.
 */
export async function forwardIdentityCheckAction(
  request: NextRequest,
  rawId: string,
  {
    action,
    body,
    fallbackMessage,
  }: { action: "reissue" | "retry-retrieval" | "decision"; body?: unknown; fallbackMessage: string }
) {
  if (!isSameOrigin(request)) {
    return errorResponse("Cross-origin identity check actions are not allowed.", 403)
  }

  const trimmedId = rawId.trim().slice(0, 128)

  if (!trimmedId) {
    return errorResponse("The identity check ID is invalid.", 400)
  }

  const id = encodeURIComponent(trimmedId)
  const result = await adminApiRequest({
    path: `identity-verification/admin/${id}/${action}`,
    method: "POST",
    body,
    schema: identityCheckResponseSchema,
    serviceName: "identity verification",
    fallbackMessage,
  })

  if (!result.ok) {
    return errorResponse(result.message, result.status)
  }

  const check = result.data.data

  revalidatePath("/dashboard/identity-checks")
  revalidatePath(`/dashboard/identity-checks/${id}`)
  // A reissue creates a new check; its page is new, but the list above already covers it.
  revalidatePath(`/dashboard/identity-checks/${encodeURIComponent(check.id)}`)

  const response = NextResponse.json({ check })
  response.headers.set("Cache-Control", "private, no-store")

  return response
}
