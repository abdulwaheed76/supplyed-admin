import { z } from "zod"

import { getAuthConfig } from "@/lib/auth/config"
import { loginSchema } from "@/lib/auth/validation"

type AuthUser = {
  id: string
  email: string
  name?: string | null
  role: "ADMIN"
}

type AuthenticationResult =
  | { ok: true; accessToken: string; expiresIn: number; user: AuthUser }
  | { ok: false; message: string; status: number }

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
      accessTokenExpiresInSeconds: z.number().int().positive().optional(),
      otpToken: z.string().optional(),
      twoFactorRequired: z.boolean().optional(),
      twoFactorToken: z.string().optional(),
    })
    .nullable(),
})

const errorResponseSchema = z.object({
  message: z.string(),
})

export async function authenticateAdmin(
  input: unknown
): Promise<AuthenticationResult> {
  const credentials = loginSchema.safeParse(input)

  if (!credentials.success) {
    return {
      ok: false,
      message: "Enter a valid email and password.",
      status: 400,
    }
  }

  const config = getAuthConfig()

  if (!config) {
    return {
      ok: false,
      message: "The backend API URL is not configured.",
      status: 503,
    }
  }

  let response: Response

  try {
    response = await fetch(new URL("/auth/login", config.apiBaseUrl), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials.data),
      cache: "no-store",
    })
  } catch {
    return {
      ok: false,
      message: "The authentication service is unavailable.",
      status: 503,
    }
  }

  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const error = errorResponseSchema.safeParse(body)

    return {
      ok: false,
      message: error.success ? error.data.message : "Unable to sign in.",
      status: response.status,
    }
  }

  const result = loginResponseSchema.safeParse(body)

  if (!result.success || !result.data.success || !result.data.data) {
    return {
      ok: false,
      message: "The authentication service returned an invalid response.",
      status: 502,
    }
  }

  const data = result.data.data

  if (data.twoFactorRequired || data.twoFactorToken) {
    return {
      ok: false,
      message: "Two-factor verification is required to continue.",
      status: 409,
    }
  }

  if (data.otpToken && !data.accessToken) {
    return {
      ok: false,
      message: "Verify your email before signing in to the admin portal.",
      status: 403,
    }
  }

  if (
    !data.user ||
    !data.accessToken ||
    !data.accessTokenExpiresInSeconds
  ) {
    return {
      ok: false,
      message: "The authentication service did not return a session.",
      status: 502,
    }
  }

  if (data.user.role !== "ADMIN") {
    return {
      ok: false,
      message: "This account does not have administrator access.",
      status: 403,
    }
  }

  return {
    ok: true,
    accessToken: data.accessToken,
    expiresIn: data.accessTokenExpiresInSeconds,
    user: { ...data.user, role: "ADMIN" },
  }
}
