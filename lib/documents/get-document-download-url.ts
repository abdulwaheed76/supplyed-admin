import "server-only"

import { cookies } from "next/headers"
import { z } from "zod"

import { createAuthApiUrl, getAuthConfig } from "@/lib/auth/config"
import { ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth/session-cookie"

export type GetDocumentDownloadUrlResult =
  | { ok: true; downloadUrl: URL; expiresAt: string }
  | { ok: false; message: string; status: number }

const downloadResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    downloadUrl: z.url(),
    expiresAt: z.string(),
  }),
})

const errorResponseSchema = z.object({
  message: z.union([z.string(), z.array(z.string())]),
})

export async function getDocumentDownloadUrl(
  documentId: string
): Promise<GetDocumentDownloadUrlResult> {
  const normalizedDocumentId = documentId.trim()

  if (!normalizedDocumentId || normalizedDocumentId.length > 128) {
    return { ok: false, message: "The document ID is invalid.", status: 400 }
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
        `documents/${encodeURIComponent(normalizedDocumentId)}/download-url`
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
      : "Unable to open this document."

    return { ok: false, message, status: response.status }
  }

  const result = downloadResponseSchema.safeParse(body)

  if (!result.success) {
    return {
      ok: false,
      message: "The documents service returned an invalid response.",
      status: 502,
    }
  }

  const downloadUrl = new URL(result.data.data.downloadUrl)
  const isSecureUrl = downloadUrl.protocol === "https:"
  const isDevelopmentUrl =
    process.env.NODE_ENV !== "production" && downloadUrl.protocol === "http:"

  if (!isSecureUrl && !isDevelopmentUrl) {
    return {
      ok: false,
      message: "The document URL is not secure.",
      status: 502,
    }
  }

  return {
    ok: true,
    downloadUrl,
    expiresAt: result.data.data.expiresAt,
  }
}
