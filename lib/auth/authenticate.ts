import { z } from "zod"

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
  const credentials = loginSchema.safeParse(input)

  if (!credentials.success) {
    return { ok: false, code: "invalid_credentials" }
  }

  const config = getAuthConfig()

  if (!config) {
    return { ok: false, code: "service_unavailable" }
  }

  let response: Response

  try {
    response = await fetch(createAuthApiUrl(config, "auth/login"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials.data),
      cache: "no-store",
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

  if (data.twoFactorRequired || data.twoFactorToken) {
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

  return {
    ok: true,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    accessTokenExpiresIn: data.accessTokenExpiresInSeconds,
    refreshTokenExpiresIn: data.refreshTokenExpiresInSeconds,
    user: { ...data.user, role: "ADMIN" },
  }
}
