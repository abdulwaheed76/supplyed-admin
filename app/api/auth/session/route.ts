import { NextResponse } from "next/server"

import { getCurrentSession } from "@/lib/auth/session"

export async function GET() {
  const session = await getCurrentSession()
  const response = NextResponse.json({
    authenticated: Boolean(session),
    user: session
      ? {
          id: session.id,
          email: session.email,
          name: session.name,
          role: session.role,
        }
      : null,
  })

  response.headers.set("Cache-Control", "no-store")

  return response
}
