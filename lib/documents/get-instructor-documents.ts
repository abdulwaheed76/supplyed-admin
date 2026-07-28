import "server-only"

import { cookies } from "next/headers"
import { z } from "zod"

import { createAuthApiUrl, getAuthConfig } from "@/lib/auth/config"
import { ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth/session-cookie"
import { instructorDocumentsResponseSchema } from "@/lib/documents/schema"
import type { InstructorDocument } from "@/lib/documents/types"

export type GetInstructorDocumentsResult =
  | { ok: true; documents: InstructorDocument[] }
  | { ok: false; message: string; status: number }

const errorResponseSchema = z.object({
  message: z.union([z.string(), z.array(z.string())]),
})

export async function getInstructorDocuments(
  userId: string
): Promise<GetInstructorDocumentsResult> {
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
      createAuthApiUrl(
        config,
        `documents/user/${encodeURIComponent(normalizedUserId)}`
      ),
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
      message: "The documents service is unavailable.",
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
      : "Unable to load this instructor's documents."

    return { ok: false, message, status: response.status }
  }

  const result = instructorDocumentsResponseSchema.safeParse(body)

  if (!result.success) {
    return {
      ok: false,
      message: "The documents service returned an invalid response.",
      status: 502,
    }
  }

  return { ok: true, documents: result.data.data }
}
