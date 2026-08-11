import "server-only"

import { cookies } from "next/headers"
import { getToken } from "next-auth/jwt"
import type { JWT } from "next-auth/jwt"

import {
  SESSION_COOKIE_NAME,
  USE_SECURE_AUTH_COOKIES,
} from "@/lib/auth/cookies"

export type AdminSessionUser = {
  id: string
  email: string
  name?: string | null
  role: "ADMIN"
}

type AccessTokenResult =
  | { ok: true; accessToken: string }
  | { ok: false; reason: "no-session" | "expired" | "misconfigured" }

/**
 * Decodes the Auth.js session cookie directly.
 *
 * Deliberately does *not* go through `auth()`. `auth()` runs the `jwt`
 * callback, which refreshes — and the proxy runs in the edge runtime while
 * Server Components run in node, so the two cannot share the refresh dedupe
 * cache. Every `auth()` call during a render would therefore hit
 * `auth/refresh` again with the request's original token, and since the backend
 * rotates on refresh, only the proxy's rotation would survive in the cookie.
 * The rest would be issued and dropped, eventually leaving the browser holding
 * a token the backend had retired.
 *
 * Refresh belongs to the proxy alone, which can persist the result. Everything
 * on the render path reads the stored token through here.
 */
async function readSessionToken(): Promise<JWT | null> {
  const secret = process.env.AUTH_SECRET

  if (!secret) {
    return null
  }

  const cookieStore = await cookies()
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ")

  return getToken({
    req: { headers: { cookie: cookieHeader } },
    secret,
    salt: SESSION_COOKIE_NAME,
    cookieName: SESSION_COOKIE_NAME,
    secureCookie: USE_SECURE_AUTH_COOKIES,
  })
}

/** Identity for rendering. Returns null when there is no usable session. */
export async function getCurrentSession(): Promise<AdminSessionUser | null> {
  const token = await readSessionToken()

  if (!token || token.error || token.role !== "ADMIN") {
    return null
  }

  if (Date.now() >= token.refreshTokenExpiresAt) {
    return null
  }

  return {
    id: token.id,
    email: token.email,
    name: token.name,
    role: "ADMIN",
  }
}

/**
 * The backend access token, for server-side API calls only.
 *
 * Kept off the `Session` object on purpose: `auth()` output is also what
 * `/api/auth/session` serves to the browser, so anything placed there is
 * readable by client JavaScript. Decoding here keeps the backend credentials
 * server-side.
 */
export async function getAdminAccessToken(): Promise<AccessTokenResult> {
  if (!process.env.AUTH_SECRET) {
    return { ok: false, reason: "misconfigured" }
  }

  const token = await readSessionToken()

  if (!token || token.error || !token.accessToken) {
    return { ok: false, reason: "no-session" }
  }

  // The proxy refreshes ahead of this deadline, so a token that is genuinely
  // past it means the refresh never happened — fail closed rather than send a
  // credential the backend will reject.
  if (Date.now() >= token.accessTokenExpiresAt) {
    return { ok: false, reason: "expired" }
  }

  return { ok: true, accessToken: token.accessToken }
}
