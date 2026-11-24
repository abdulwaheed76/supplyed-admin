import "server-only"

import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"

export type GetIdentityReportUrlResult =
  | { ok: true; reportUrl: URL }
  | { ok: false; message: string; status: number }

const reportUrlResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ url: z.url(), expiresAt: z.string() }),
})

/** Presigns TrustID's PDF report for an admin to fetch. */
export async function getIdentityReportUrl(id: string): Promise<GetIdentityReportUrlResult> {
  const normalizedId = id.trim()

  if (!normalizedId || normalizedId.length > 128) {
    return { ok: false, message: "The identity check ID is invalid.", status: 400 }
  }

  const result = await adminApiRequest({
    path: `identity-verification/admin/${encodeURIComponent(normalizedId)}/report-url`,
    schema: reportUrlResponseSchema,
    serviceName: "identity verification",
    fallbackMessage: "Unable to open the TrustID report.",
  })

  if (!result.ok) {
    return result
  }

  const reportUrl = new URL(result.data.data.url)
  const isSecureUrl = reportUrl.protocol === "https:"
  const isDevelopmentUrl =
    process.env.NODE_ENV !== "production" && reportUrl.protocol === "http:"

  if (!isSecureUrl && !isDevelopmentUrl) {
    return { ok: false, message: "The report URL is not secure.", status: 502 }
  }

  return { ok: true, reportUrl }
}
