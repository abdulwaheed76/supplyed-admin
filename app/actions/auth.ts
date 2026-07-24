"use server"

import { cookies } from "next/headers"

import { authenticateAdmin } from "@/lib/auth/authenticate"
import {
  ACCESS_TOKEN_COOKIE_NAME,
  getAccessTokenCookieOptions,
} from "@/lib/auth/session-cookie"

export async function loginAction(input: unknown) {
  const result = await authenticateAdmin(input)

  if (!result.ok) {
    return { ok: false as const, message: result.message }
  }

  const cookieStore = await cookies()
  cookieStore.set(
    ACCESS_TOKEN_COOKIE_NAME,
    result.accessToken,
    getAccessTokenCookieOptions(result.expiresIn)
  )

  return { ok: true as const, user: result.user }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.set(ACCESS_TOKEN_COOKIE_NAME, "", {
    ...getAccessTokenCookieOptions(0),
    maxAge: 0,
  })

  return { ok: true as const }
}
