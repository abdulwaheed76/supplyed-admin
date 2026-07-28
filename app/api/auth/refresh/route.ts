import { NextResponse, type NextRequest } from "next/server"

import { refreshAdminSession } from "@/lib/auth/refresh"
import {
  getClearedSessionCookies,
  getSessionCookies,
  REFRESH_TOKEN_COOKIE_NAME,
} from "@/lib/auth/session-cookie"

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")

  return !origin || origin === request.nextUrl.origin
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { message: "Cross-origin refresh requests are not allowed." },
      { status: 403 }
    )
  }

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value

  if (!refreshToken) {
    const response = NextResponse.json(
      { message: "Your session has expired. Sign in again." },
      { status: 401 }
    )

    for (const cookie of getClearedSessionCookies()) {
      response.cookies.set(cookie)
    }

    response.headers.set("Cache-Control", "no-store")

    return response
  }

  const result = await refreshAdminSession(refreshToken)

  if (!result.ok) {
    const response = NextResponse.json(
      { message: result.message },
      { status: result.status }
    )

    if (result.status < 500) {
      for (const cookie of getClearedSessionCookies()) {
        response.cookies.set(cookie)
      }
    }

    response.headers.set("Cache-Control", "no-store")

    return response
  }

  const response = NextResponse.json({ user: result.user })

  for (const cookie of getSessionCookies(result)) {
    response.cookies.set(cookie)
  }

  response.headers.set("Cache-Control", "no-store")

  return response
}
