import { NextResponse, type NextRequest } from "next/server"

import { authenticateAdmin } from "@/lib/auth/authenticate"
import { getSessionCookies } from "@/lib/auth/session-cookie"

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")

  return !origin || origin === request.nextUrl.origin
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { message: "Cross-origin login requests are not allowed." },
      { status: 403 }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { message: "The request body must be valid JSON." },
      { status: 400 }
    )
  }

  const result = await authenticateAdmin(body)

  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status }
    )
  }

  const response = NextResponse.json({ user: result.user })

  for (const cookie of getSessionCookies(result)) {
    response.cookies.set(cookie)
  }

  response.headers.set("Cache-Control", "no-store")

  return response
}
