import { NextResponse, type NextRequest } from "next/server"

import { refreshAdminSession } from "@/lib/auth/refresh"
import {
  ACCESS_TOKEN_COOKIE_NAME,
  getClearedSessionCookies,
  getSessionCookies,
  REFRESH_TOKEN_COOKIE_NAME,
} from "@/lib/auth/session-cookie"

function createLoginRedirect(request: NextRequest) {
  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  )

  return NextResponse.redirect(loginUrl)
}

export async function proxy(request: NextRequest) {
  if (request.cookies.has(ACCESS_TOKEN_COOKIE_NAME)) {
    return NextResponse.next()
  }

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value

  if (!refreshToken) {
    return createLoginRedirect(request)
  }

  const result = await refreshAdminSession(refreshToken)

  if (!result.ok) {
    const response = createLoginRedirect(request)

    if (result.status < 500) {
      for (const cookie of getClearedSessionCookies()) {
        response.cookies.set(cookie)
      }
    }

    response.headers.set("Cache-Control", "no-store")

    return response
  }

  const response = NextResponse.redirect(request.nextUrl)

  for (const cookie of getSessionCookies(result)) {
    response.cookies.set(cookie)
  }

  response.headers.set("Cache-Control", "no-store")

  return response
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
