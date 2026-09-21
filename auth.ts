import NextAuth from "next-auth"
import { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import type { JWT } from "next-auth/jwt"
import { NextResponse } from "next/server"

import { authenticateAdmin } from "@/lib/auth/authenticate"
import {
  CALLBACK_URL_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  USE_SECURE_AUTH_COOKIES,
} from "@/lib/auth/cookies"
import type { SignInErrorCode } from "@/lib/auth/errors"
import { refreshAdminSession } from "@/lib/auth/refresh"

/**
 * How far ahead of true expiry the proxy rotates the access token.
 *
 * This needs to be generous, not just clock-skew sized. When the proxy
 * refreshes, the rotated cookie goes out on the *response* — the Server
 * Components rendering that same request still read the previous token. That
 * token has to stay valid for the whole render, so the lead time is the budget
 * for it. Two minutes leaves ample room for a slow page without shortening the
 * effective session.
 */
const ACCESS_TOKEN_SKEW_MS = 120_000

/** Upper bound on the Auth.js cookie. The real cutoff is `refreshTokenExpiresAt`. */
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

class SignInError extends CredentialsSignin {
  constructor(readonly code: SignInErrorCode) {
    super(code)
  }
}

/**
 * How long a completed refresh stays replayable for the same input token.
 *
 * The `jwt` callback runs more than once per browser request — the proxy
 * resolves the session, then each Server Component that calls `auth()` resolves
 * it again from the *original* request cookie, since the proxy's rotated cookie
 * only reaches the browser on the response. Without this cache each of those
 * would hit `auth/refresh` separately, and because the backend rotates refresh
 * tokens, every rotation after the first would be discarded: the browser would
 * end up holding a token the backend had already retired.
 *
 * Caching the result keyed on the token that was consumed makes all of those
 * callers agree on one rotation. It also collapses genuinely concurrent
 * refreshes, which would race the same way.
 *
 * This is per server instance. Across instances (or during a rolling deploy)
 * two refreshes can still race, so the backend should tolerate a short reuse
 * window on a just-rotated refresh token.
 */
const REFRESH_CACHE_TTL_MS = 60_000

const refreshCache = new Map<
  string,
  { result: Promise<JWT>; expiresAt: number }
>()

async function refreshSessionToken(token: JWT): Promise<JWT> {
  const now = Date.now()

  for (const [key, entry] of refreshCache) {
    if (entry.expiresAt <= now) {
      refreshCache.delete(key)
    }
  }

  const cached = refreshCache.get(token.refreshToken)

  if (cached) {
    return cached.result
  }

  const refreshing = (async (): Promise<JWT> => {
    const result = await refreshAdminSession(token.refreshToken)

    if (!result.ok) {
      // A 5xx means the auth service is down, not that the session is invalid.
      // Keep the token so the next request can retry instead of forcing a
      // sign-out on a transient outage.
      if (result.status >= 500) {
        return token
      }

      return { ...token, error: "RefreshFailed" as const }
    }

    return {
      ...token,
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      accessTokenExpiresAt: Date.now() + result.accessTokenExpiresIn * 1000,
      refreshTokenExpiresAt: Date.now() + result.refreshTokenExpiresIn * 1000,
      error: undefined,
    }
  })()

  refreshCache.set(token.refreshToken, {
    result: refreshing,
    expiresAt: now + REFRESH_CACHE_TTL_MS,
  })

  // A failed refresh must not be replayed from cache: the next request should
  // be free to try again rather than inherit a transient outage.
  refreshing.catch(() => refreshCache.delete(token.refreshToken))

  return refreshing
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  pages: { signIn: "/login", error: "/login" },
  useSecureCookies: USE_SECURE_AUTH_COOKIES,
  cookies: {
    sessionToken: {
      name: SESSION_COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: USE_SECURE_AUTH_COOKIES,
      },
    },
    // Renamed for the same reason as the session cookie (see
    // lib/auth/cookies.ts). Under the default names the frontend could
    // overwrite this app's CSRF cookie between the login form loading and
    // being submitted, failing the sign-in with a CSRF mismatch.
    csrfToken: {
      name: CSRF_COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: USE_SECURE_AUTH_COOKIES,
      },
    },
    callbackUrl: {
      name: CALLBACK_URL_COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: USE_SECURE_AUTH_COOKIES,
      },
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const result = await authenticateAdmin(credentials)

        if (!result.ok) {
          throw new SignInError(result.code)
        }

        return {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          accessTokenExpiresIn: result.accessTokenExpiresIn,
          refreshTokenExpiresIn: result.refreshTokenExpiresIn,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpiresAt: Date.now() + user.accessTokenExpiresIn * 1000,
          refreshTokenExpiresAt: Date.now() + user.refreshTokenExpiresIn * 1000,
          error: undefined,
        }
      }

      // Already failed closed; do not keep hammering the auth service.
      if (token.error) {
        return token
      }

      if (Date.now() < token.accessTokenExpiresAt - ACCESS_TOKEN_SKEW_MS) {
        return token
      }

      if (Date.now() >= token.refreshTokenExpiresAt) {
        return { ...token, error: "RefreshFailed" as const }
      }

      return refreshSessionToken(token)
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id,
        email: token.email,
        name: token.name,
        role: token.role,
      }
      session.error = token.error

      return session
    },
    authorized({ request, auth: session }) {
      // Route gating only — no network calls here. Token refresh is owned by
      // the `jwt` callback above, which Auth.js runs as part of resolving
      // `session` and which can persist the rotated token from this context.
      if (session?.user && !session.error) {
        return true
      }

      // Route handlers are called by `fetch` from client components; an HTML
      // login redirect there would be parsed as a failed JSON response.
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json(
          { message: "Your session has expired. Sign in again." },
          { status: 401, headers: { "Cache-Control": "no-store" } }
        )
      }

      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set(
        "next",
        `${request.nextUrl.pathname}${request.nextUrl.search}`
      )

      const response = NextResponse.redirect(loginUrl)
      response.headers.set("Cache-Control", "no-store")

      return response
    },
  },
})
