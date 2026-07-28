import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { refreshAdminSession } from "@/lib/auth/refresh"
import { getCurrentSession } from "@/lib/auth/session"
import {
  getClearedSessionCookies,
  getSessionCookies,
  REFRESH_TOKEN_COOKIE_NAME,
} from "@/lib/auth/session-cookie"

function createSessionResponse(
  user: {
    id: string
    email: string
    name?: string | null
    role: "ADMIN"
  } | null
) {
  return NextResponse.json({
    authenticated: Boolean(user),
    user,
  })
}

export async function GET() {
  const session = await getCurrentSession()

  if (session) {
    const response = createSessionResponse(session)
    response.headers.set("Cache-Control", "no-store")

    return response
  }

  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value

  if (!refreshToken) {
    const response = createSessionResponse(null)
    response.headers.set("Cache-Control", "no-store")

    return response
  }

  const result = await refreshAdminSession(refreshToken)
  const response = createSessionResponse(result.ok ? result.user : null)

  if (result.ok) {
    for (const cookie of getSessionCookies(result)) {
      response.cookies.set(cookie)
    }
  } else if (result.status < 500) {
    for (const cookie of getClearedSessionCookies()) {
      response.cookies.set(cookie)
    }
  }

  response.headers.set("Cache-Control", "no-store")

  return response
}
