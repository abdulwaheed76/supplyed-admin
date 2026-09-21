import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import { userSchema } from "@/lib/users/schema"

const inputSchema = z.object({
  email: z.email().transform((email) => email.trim().toLowerCase()),
  password: z.string().min(8).regex(/(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/, "Use an uppercase letter, a number, and a special character."),
  name: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(30).optional(),
  emailVerified: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
}).refine((input) => !input.phoneVerified || Boolean(input.phone), {
  message: "Enter a phone number before marking it verified.",
})

const responseSchema = z.object({ success: z.literal(true), data: userSchema })

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Cross-origin user creation is not allowed." }, { status: 403 })
  }

  const parsed = inputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid user details." }, { status: 400 })
  }

  const result = await adminApiRequest({
    path: "users/admin",
    method: "POST",
    body: parsed.data,
    schema: responseSchema,
    serviceName: "users",
    fallbackMessage: "Unable to create the user.",
  })
  if (!result.ok) {
    const message = result.status === 404 && /Cannot POST/i.test(result.message)
      ? "This backend server is running an older build. Restart it to enable user creation."
      : result.message
    return NextResponse.json({ message }, { status: result.status })
  }

  revalidatePath("/dashboard/users")
  return NextResponse.json({ user: result.data.data }, { status: 201, headers: { "Cache-Control": "private, no-store" } })
}
