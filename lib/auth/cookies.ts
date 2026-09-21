/**
 * Auth.js derives the JWT encryption salt from the session cookie name, so the
 * name is pinned here rather than left to the library's environment sniffing.
 * `auth.ts` configures the cookies with these values and
 * `lib/auth/session.ts` decodes the session with the same ones.
 *
 * The names carry an app-specific prefix instead of Auth.js's default
 * `authjs.*`. In local development this app (localhost:3001) and the Supplyed
 * frontend (localhost:3002) share the `localhost` cookie jar — browsers do not
 * scope cookies by port — and both are Auth.js apps with different secrets.
 * Under the default names every gated request in one app overwrote the
 * other's session cookie with one it could not decrypt, which surfaced as
 * being signed out whenever the two were used side by side.
 */
export const USE_SECURE_AUTH_COOKIES = process.env.NODE_ENV === "production"

const COOKIE_NAMESPACE = "supplyed-admin"

export const SESSION_COOKIE_NAME = USE_SECURE_AUTH_COOKIES
  ? `__Secure-${COOKIE_NAMESPACE}.session-token`
  : `${COOKIE_NAMESPACE}.session-token`

export const CALLBACK_URL_COOKIE_NAME = USE_SECURE_AUTH_COOKIES
  ? `__Secure-${COOKIE_NAMESPACE}.callback-url`
  : `${COOKIE_NAMESPACE}.callback-url`

/** `__Host-`, not `__Secure-`, matching Auth.js's own default for this cookie. */
export const CSRF_COOKIE_NAME = USE_SECURE_AUTH_COOKIES
  ? `__Host-${COOKIE_NAMESPACE}.csrf-token`
  : `${COOKIE_NAMESPACE}.csrf-token`
