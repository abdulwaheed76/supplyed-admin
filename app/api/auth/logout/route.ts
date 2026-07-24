import { NextResponse, type NextRequest } from "next/server"

import {
  ACCESS_TOKEN_COOKIE_NAME,
  getAccessTokenCookieOptions,
} from "@/lib/auth/session-cookie"

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin")

  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: "Cross-origin logout requests are not allowed." },
      { status: 403 }
    )
  }

  const response = NextResponse.json({ success: true })

  response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, "", {
    ...getAccessTokenCookieOptions(0),
    maxAge: 0,
  })
  response.headers.set("Cache-Control", "no-store")

  return response
}
