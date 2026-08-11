import { auth } from "@/auth"

/**
 * Route gating only. The `authorized` callback in `auth.ts` decides what passes;
 * this file exists to attach it to the matcher below.
 *
 * Resolving the session here also gives the `jwt` callback a context that can
 * persist a rotated token — Server Components cannot set cookies, so a refresh
 * triggered during render would be thrown away. Keeping the matcher ahead of
 * every authenticated route means the token is already fresh by the time a page
 * renders.
 */
export const proxy = auth

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/documents/:path*",
    "/api/institutions/:path*",
    "/api/instructors/:path*",
    "/api/jobs/:path*",
  ],
}
