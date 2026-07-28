import "server-only"

import { cookies } from "next/headers"
import { z } from "zod"

import { createAuthApiUrl, getAuthConfig } from "@/lib/auth/config"
import { ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth/session-cookie"
import { userSchema, type UserListItem } from "@/lib/users/schema"

type GetUserResult =
  | { ok: true; user: UserListItem }
  | { ok: false; message: string; status: number }

const userResponseSchema = z.object({
  success: z.literal(true),
  data: userSchema,
})

const errorResponseSchema = z.object({
  message: z.union([z.string(), z.array(z.string())]),
})

export async function getUser(userId: string): Promise<GetUserResult> {
  const normalizedUserId = userId.trim()

  if (!normalizedUserId || normalizedUserId.length > 128) {
    return { ok: false, message: "The user ID is invalid.", status: 400 }
  }

  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value
  const config = getAuthConfig()

  if (!accessToken) {
    return {
      ok: false,
      message: "Your session has expired. Sign in again.",
      status: 401,
    }
  }

  if (!config) {
    return {
      ok: false,
      message: "The backend API URL is not configured.",
      status: 503,
    }
  }

  let response: Response

  try {
    response = await fetch(
      createAuthApiUrl(config, `users/${encodeURIComponent(normalizedUserId)}`),
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    )
  } catch {
    return {
      ok: false,
      message: "The users service is unavailable.",
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
      : "Unable to load this user."

    return { ok: false, message, status: response.status }
  }

  const result = userResponseSchema.safeParse(body)

  if (!result.success) {
    return {
      ok: false,
      message: "The users service returned an invalid response.",
      status: 502,
    }
  }

  return { ok: true, user: result.data.data }
}
