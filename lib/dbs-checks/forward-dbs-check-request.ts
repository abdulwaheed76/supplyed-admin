import "server-only"

import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import type { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"

export function dbsErrorResponse(message: string, status: number) {
  return NextResponse.json({ message }, { status, headers: { "Cache-Control": "private, no-store" } })
}

/**
 * The DBS check route handlers share this: same-origin check, forward the POST
 * to the backend, refresh the identity-check page it shows on, and return the
 * response's `data` under `key`. A body is passed only once the route handler
 * has validated it.
 */
export async function forwardDbsCheckRequest<T extends { data: unknown }>(
  request: NextRequest,
  {
    path,
    body,
    schema,
    key,
    identityCheckId,
    fallbackMessage,
  }: {
    path: string
    body: unknown
    schema: z.ZodType<T>
    key: "dbsCheck" | "preview"
    identityCheckId?: string
    fallbackMessage: string
  }
) {
  const origin = request.headers.get("origin")

  if (origin && origin !== request.nextUrl.origin) {
    return dbsErrorResponse("Cross-origin DBS check actions are not allowed.", 403)
  }

  const result = await adminApiRequest({
    path,
    method: "POST",
    body,
    schema,
    serviceName: "DBS checks",
    fallbackMessage,
  })

  if (!result.ok) {
    return dbsErrorResponse(result.message, result.status)
  }

  const data = result.data.data

  if (key === "dbsCheck") {
    const linkedCheckId =
      identityCheckId ?? (data as { identityVerificationId?: string }).identityVerificationId

    revalidatePath("/dashboard/identity-checks")

    if (linkedCheckId) {
      revalidatePath(`/dashboard/identity-checks/${encodeURIComponent(linkedCheckId)}`)
    }
  }

  const response = NextResponse.json({ [key]: data })
  response.headers.set("Cache-Control", "private, no-store")

  return response
}
