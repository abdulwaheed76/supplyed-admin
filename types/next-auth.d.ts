import type { DefaultSession } from "next-auth"

/**
 * The backend issues its own access/refresh pair, so the Auth.js session is a
 * carrier for those tokens rather than the source of truth for identity.
 * `error` is how the `jwt` callback reports an unrecoverable refresh failure —
 * it cannot sign the user out on its own.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: "ADMIN"
    } & DefaultSession["user"]
    error?: "RefreshFailed"
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: "ADMIN"
    accessToken: string
    refreshToken: string
    accessTokenExpiresIn: number
    refreshTokenExpiresIn: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name?: string | null
    role: "ADMIN"
    accessToken: string
    refreshToken: string
    /** Epoch milliseconds at which `accessToken` stops being accepted. */
    accessTokenExpiresAt: number
    /** Epoch milliseconds at which `refreshToken` stops being accepted. */
    refreshTokenExpiresAt: number
    error?: "RefreshFailed"
  }
}

export {}
