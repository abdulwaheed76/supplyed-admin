import "server-only"

import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import { degreeCheckResponseSchema } from "@/lib/degree-checks/schema"

export function degreeErrorResponse(message: string, status: number) {
  return NextResponse.json({ message }, { status, headers: { "Cache-Control": "private, no-store" } })
}

/**
 * The decision and cancel route handlers share this: same-origin check,
 * forward the POST, refresh the degree-check and teacher pages, and return the
 * updated check. A body is passed only once the route handler has validated it.
 */
export async function forwardDegreeCheckAction(
  request: NextRequest,
  rawId: string,
  { action, body, fallbackMessage }: { action: "decision" | "cancel"; body: unknown; fallbackMessage: string }
) {
  const origin = request.headers.get("origin")

  if (origin && origin !== request.nextUrl.origin) {
    return degreeErrorResponse("Cross-origin degree check actions are not allowed.", 403)
  }

  const trimmedId = rawId.trim().slice(0, 128)

  if (!trimmedId) {
    return degreeErrorResponse("The degree check ID is invalid.", 400)
  }

  const id = encodeURIComponent(trimmedId)
  const result = await adminApiRequest({
    path: `degree-checks/admin/${id}/${action}`,
    method: "POST",
    body,
    schema: degreeCheckResponseSchema,
    serviceName: "degree checks",
    fallbackMessage,
  })

  if (!result.ok) {
    return degreeErrorResponse(result.message, result.status)
  }

  const check = result.data.data

  revalidatePath("/dashboard/degree-checks")
  revalidatePath(`/dashboard/degree-checks/${id}`)
  revalidatePath(`/dashboard/users/${encodeURIComponent(check.user.id)}`)

  const response = NextResponse.json({ check })
  response.headers.set("Cache-Control", "private, no-store")

  return response
}
