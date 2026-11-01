import "server-only"

import { z } from "zod"

import { createAuthApiUrl, getAuthConfig } from "@/lib/auth/config"

type RefreshedAdminSession = {
  accessToken: string
  refreshToken: string
  accessTokenExpiresIn: number
  refreshTokenExpiresIn: number
  user: {
    id: string
    email: string
    name?: string | null
    role: "ADMIN"
  }
}

type RefreshResult =
  | ({ ok: true } & RefreshedAdminSession)
  | { ok: false; message: string; status: number }

const refreshResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    user: z.object({
      id: z.string(),
      email: z.email(),
      name: z.string().nullable().optional(),
      role: z.string(),
    }),
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    accessTokenExpiresInSeconds: z.number().int().positive(),
    refreshTokenExpiresInSeconds: z.number().int().positive(),
  }),
})

const errorResponseSchema = z.object({
  message: z.union([z.string(), z.array(z.string())]),
})

export async function refreshAdminSession(
  refreshToken: string
): Promise<RefreshResult> {
  const config = getAuthConfig()

  if (!refreshToken || !config) {
    return {
      ok: false,
      message: "A valid refresh token is required.",
      status: 401,
    }
  }

  let response: Response

  try {
    response = await fetch(createAuthApiUrl(config, "auth/refresh"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(process.env.BFF_SHARED_SECRET ? { "X-SupplyEd-BFF": process.env.BFF_SHARED_SECRET } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
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
    const message = error.success
      ? Array.isArray(error.data.message)
        ? error.data.message.join(" ")
        : error.data.message
      : "Unable to refresh the session."

    return { ok: false, message, status: response.status }
  }

  const result = refreshResponseSchema.safeParse(body)

  if (!result.success) {
    return {
      ok: false,
      message: "The authentication service returned an invalid response.",
      status: 502,
    }
  }

  if (result.data.data.user.role !== "ADMIN") {
    return {
      ok: false,
      message: "This account does not have administrator access.",
      status: 403,
    }
  }

  const data = result.data.data

  return {
    ok: true,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    accessTokenExpiresIn: data.accessTokenExpiresInSeconds,
    refreshTokenExpiresIn: data.refreshTokenExpiresInSeconds,
    user: { ...data.user, role: "ADMIN" },
  }
}
