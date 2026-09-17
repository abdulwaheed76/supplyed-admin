import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import { getCurrentSession } from "@/lib/auth/session"

const responseSchema = z.object({
  success: z.literal(true),
  data: z.object({ enabled: z.literal(false) }),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get("origin")
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Cross-origin requests are not allowed." }, { status: 403 })
  }

  const parsedId = z.uuid().safeParse((await params).id)
  if (!parsedId.success) {
    return NextResponse.json({ message: "The user ID is invalid." }, { status: 400 })
  }
  const id = parsedId.data
  const session = await getCurrentSession()
  if (session?.id === id) {
    return NextResponse.json({ message: "Use your own 2FA settings to disable 2FA with a code." }, { status: 400 })
  }

  const result = await adminApiRequest({
    path: "auth/2fa/admin/" + encodeURIComponent(id) + "/disable",
    method: "POST",
    schema: responseSchema,
    serviceName: "two-factor authentication",
    fallbackMessage: "Unable to disable two-factor authentication.",
  })
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status })
  }

  revalidatePath("/dashboard/users/" + encodeURIComponent(id))
  const response = NextResponse.json({ enabled: false })
  response.headers.set("Cache-Control", "private, no-store")
  return response
}
