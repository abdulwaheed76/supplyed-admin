import "server-only"

import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"

export type GetDocumentDownloadUrlResult =
  | { ok: true; downloadUrl: URL; expiresAt: string }
  | { ok: false; message: string; status: number }

/**
 * Mirrors `DownloadUrlResponseDto`. The backend also returns the version's
 * metadata (`versionId`, `contentType`, `sizeBytes`, ...); only the presigned
 * URL is needed here, since the content route reads the real content type
 * from storage rather than trusting a value sent alongside the URL.
 */
const downloadResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    url: z.url(),
    expiresAt: z.string(),
  }),
})

/** Presigns the document's current file version for an admin to fetch. */
export async function getDocumentDownloadUrl(
  documentId: string
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
  }
}
