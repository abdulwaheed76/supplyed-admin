import "server-only"

import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"

export type GetDbsReportUrlResult =
  | { ok: true; reportUrl: URL }
  | { ok: false; message: string; status: number }

const reportUrlResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ url: z.url(), expiresAt: z.string() }),
})

/** Presigns uCheck's PDF result report for an admin to fetch. */
export async function getDbsReportUrl(id: string): Promise<GetDbsReportUrlResult> {
  const normalizedId = id.trim()

  if (!normalizedId || normalizedId.length > 128) {
    return { ok: false, message: "The DBS check ID is invalid.", status: 400 }
  }

  const result = await adminApiRequest({
    path: `dbs-checks/admin/${encodeURIComponent(normalizedId)}/report-url`,
    schema: reportUrlResponseSchema,
    serviceName: "DBS checks",
    fallbackMessage: "Unable to open the uCheck report.",
  })

  if (!result.ok) {
    return result
  }

  const reportUrl = new URL(result.data.data.url)
  const isSecureUrl = reportUrl.protocol === "https:"
  const isDevelopmentUrl = process.env.NODE_ENV !== "production" && reportUrl.protocol === "http:"

  if (!isSecureUrl && !isDevelopmentUrl) {
    return { ok: false, message: "The report URL is not secure.", status: 502 }
  }

  return { ok: true, reportUrl }
}
