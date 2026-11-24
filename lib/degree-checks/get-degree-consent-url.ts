import "server-only"

import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"

const consentUrlResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ url: z.url(), expiresAt: z.string() }),
})

/** Presigns the teacher's signed consent form for an admin to fetch. */
export async function getDegreeConsentUrl(
  id: string
): Promise<{ ok: true; consentUrl: URL } | { ok: false; message: string; status: number }> {
  const normalizedId = id.trim()

  if (!normalizedId || normalizedId.length > 128) {
    return { ok: false, message: "The degree check ID is invalid.", status: 400 }
  }

  const result = await adminApiRequest({
    path: `degree-checks/admin/${encodeURIComponent(normalizedId)}/consent-url`,
    schema: consentUrlResponseSchema,
    serviceName: "degree checks",
    fallbackMessage: "Unable to open the consent form.",
  })

  if (!result.ok) {
    return result
  }

  const consentUrl = new URL(result.data.data.url)
  const isSecureUrl = consentUrl.protocol === "https:"
  const isDevelopmentUrl = process.env.NODE_ENV !== "production" && consentUrl.protocol === "http:"

  if (!isSecureUrl && !isDevelopmentUrl) {
    return { ok: false, message: "The consent form URL is not secure.", status: 502 }
  }

  return { ok: true, consentUrl }
}
