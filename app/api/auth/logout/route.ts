import { NextResponse, type NextRequest } from "next/server"

import { getClearedSessionCookies } from "@/lib/auth/session-cookie"

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin")

  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: "Cross-origin logout requests are not allowed." },
      { status: 403 }
    )
  }

  const response = NextResponse.json({ success: true })

  for (const cookie of getClearedSessionCookies()) {
    response.cookies.set(cookie)
  }

  response.headers.set("Cache-Control", "no-store")

  return response
}
