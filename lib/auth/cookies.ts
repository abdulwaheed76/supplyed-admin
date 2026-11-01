/**
 * Auth.js derives the JWT encryption salt from the session cookie name, so the
 * name is pinned here rather than left to the library's environment sniffing.
 * `auth.ts` configures the cookie with these values and
 * `lib/auth/session.ts` decodes it with the same ones.
 */
export const USE_SECURE_AUTH_COOKIES = process.env.NODE_ENV === "production"

export const SESSION_COOKIE_NAME = USE_SECURE_AUTH_COOKIES
  ? "__Secure-authjs.session-token"
  : "authjs.session-token"
