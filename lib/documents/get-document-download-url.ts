import "server-only"

import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"

export type GetDocumentDownloadUrlResult =
  | {
      ok: true
      downloadUrl: URL
      expiresAt: string
      contentType?: string
      originalName?: string | null
    }
  | { ok: false; message: string; status: number }

/** File metadata is used only when storage returns a generic binary content type. */
const downloadResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    url: z.url(),
    expiresAt: z.string(),
    contentType: z.string().optional(),
    originalName: z.string().nullable().optional(),
  }),
})

/** Presigns the document's current file version for an admin to fetch. */
export async function getDocumentDownloadUrl(
  documentId: string,
): Promise<GetDocumentDownloadUrlResult> {
  const normalizedDocumentId = documentId.trim()

  if (!normalizedDocumentId || normalizedDocumentId.length > 128) {
    return { ok: false, message: "The document ID is invalid.", status: 400 }
  }

  const result = await adminApiRequest({
    path: `documents/admin/${encodeURIComponent(normalizedDocumentId)}/download-url`,
    schema: downloadResponseSchema,
    serviceName: "documents",
    fallbackMessage: "Unable to open this document.",
  })

  if (!result.ok) {
    return result
  }

  const downloadUrl = new URL(result.data.data.url)
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
    contentType: result.data.data.contentType,
    originalName: result.data.data.originalName,
  }
}
