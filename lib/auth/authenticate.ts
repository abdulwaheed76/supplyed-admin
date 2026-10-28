import { z } from "zod"
import { cookies } from "next/headers"
import { USE_SECURE_AUTH_COOKIES } from "./cookies"

import { createAuthApiUrl, getAuthConfig } from "@/lib/auth/config"
import type { SignInErrorCode } from "@/lib/auth/errors"
import { loginSchema } from "@/lib/auth/validation"

type AuthUser = {
  id: string
  email: string
  name?: string | null
  role: "ADMIN"
}

type AuthenticationResult =
  | {
      ok: true
      accessToken: string
      refreshToken: string
      accessTokenExpiresIn: number
      refreshTokenExpiresIn: number
      user: AuthUser
    }
  | { ok: false; code: SignInErrorCode }

const backendUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().nullable().optional(),
  role: z.string(),
})

const loginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z
    .object({
      user: backendUserSchema.optional(),
      accessToken: z.string().optional(),
      refreshToken: z.string().optional(),
      accessTokenExpiresInSeconds: z.number().int().positive().optional(),
      refreshTokenExpiresInSeconds: z.number().int().positive().optional(),
      otpToken: z.string().optional(),
      twoFactorRequired: z.boolean().optional(),
      twoFactorToken: z.string().optional(),
    })
    .nullable(),
})

export async function authenticateAdmin(
  input: unknown
): Promise<AuthenticationResult> {
  const code = z.object({ code: z.string().regex(/^(?:\d{6}|[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){3})$/i) }).safeParse(input)
  const cookieStore = await cookies()
  const challenge = code.success ? cookieStore.get("supplyed_admin_2fa")?.value : undefined
  const credentials = loginSchema.safeParse(input)

  if (!credentials.success && !challenge) {
    return { ok: false, code: "invalid_credentials" }
  }

  const config = getAuthConfig()

  if (!config) {
    return { ok: false, code: "service_unavailable" }
  }

  let response: Response

  try {
    response = await fetch(createAuthApiUrl(config, challenge ? "auth/2fa/verify" : "auth/login"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(process.env.BFF_SHARED_SECRET ? { "X-SupplyEd-BFF": process.env.BFF_SHARED_SECRET } : {}),
        ...(challenge ? { Authorization: `Bearer ${challenge}` } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(challenge && code.success ? { code: code.data.code } : credentials.data),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    return { ok: false, code: "service_unavailable" }
  }

  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    return {
      ok: false,
      code:
        response.status >= 500 ? "service_unavailable" : "invalid_credentials",
    }
  }

  const result = loginResponseSchema.safeParse(body)

  if (!result.success || !result.data.success || !result.data.data) {
    return { ok: false, code: "service_unavailable" }
  }

  const data = result.data.data

  if (data.twoFactorRequired && data.twoFactorToken) {
    cookieStore.set("supplyed_admin_2fa", data.twoFactorToken, {
      httpOnly: true, secure: USE_SECURE_AUTH_COOKIES, sameSite: "strict", path: "/api/auth", maxAge: 300,
    })
    return { ok: false, code: "two_factor_required" }
  }

  if (data.otpToken && !data.accessToken) {
    return { ok: false, code: "email_unverified" }
  }

  if (
    !data.user ||
    !data.accessToken ||
    !data.refreshToken ||
    !data.accessTokenExpiresInSeconds ||
    !data.refreshTokenExpiresInSeconds
  ) {
    return { ok: false, code: "service_unavailable" }
  }

  if (data.user.role !== "ADMIN") {
    return { ok: false, code: "not_admin" }
  }

  cookieStore.delete({ name: "supplyed_admin_2fa", path: "/api/auth" })
  return {
    ok: true,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    accessTokenExpiresIn: data.accessTokenExpiresInSeconds,
    refreshTokenExpiresIn: data.refreshTokenExpiresInSeconds,
    user: { ...data.user, role: "ADMIN" },
  }
}
