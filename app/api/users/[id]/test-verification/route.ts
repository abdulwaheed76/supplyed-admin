import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import { identityCheckResponseSchema } from "@/lib/identity-checks/schema"

/**
 * Forwards to `POST /identity-verification/admin/users/:userId/test-verify`,
 * which passes the teacher through TrustID and DBS without either check. The
 * backend refuses it unless TEST_VERIFICATION_ENABLED is on (dev only).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get("origin")
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Cross-origin requests are not allowed." }, { status: 403 })
  }

  const parsedId = z.uuid().safeParse((await params).id)
  if (!parsedId.success) {
    return NextResponse.json({ message: "The user ID is invalid." }, { status: 400 })
  }
  const id = encodeURIComponent(parsedId.data)

  const result = await adminApiRequest({
    path: `identity-verification/admin/users/${id}/test-verify`,
    method: "POST",
    schema: identityCheckResponseSchema,
    serviceName: "identity verification",
    fallbackMessage: "Unable to mark the teacher verified.",
  })
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status })
  }

  revalidatePath(`/dashboard/users/${id}`)
  revalidatePath("/dashboard/identity-checks")
  revalidatePath("/dashboard/dbs-checks")
  const response = NextResponse.json({ check: result.data.data })
  response.headers.set("Cache-Control", "private, no-store")
  return response
}
