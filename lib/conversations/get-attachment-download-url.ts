import "server-only"

import { adminApiRequest, type AdminApiResult } from "@/lib/api/admin-api-client"
import { attachmentDownloadResponseSchema, conversationIdSchema } from "@/lib/conversations/schema"

export async function getAttachmentDownloadUrl(
  conversationId: string,
  attachmentId: string,
): Promise<AdminApiResult<{ url: URL }>> {
  const conversation = conversationIdSchema.safeParse(conversationId)
  const attachment = conversationIdSchema.safeParse(attachmentId)
  if (!conversation.success || !attachment.success) {
    return { ok: false, message: "The conversation or attachment ID is invalid.", status: 400 }
  }

  const result = await adminApiRequest({
    path: `conversations/${encodeURIComponent(conversation.data)}/attachments/${encodeURIComponent(attachment.data)}/download-url`,
    schema: attachmentDownloadResponseSchema,
    serviceName: "conversations",
    fallbackMessage: "Unable to download this attachment.",
  })
  if (!result.ok) return result

  const url = new URL(result.data.data.url)
  const developmentUrl = process.env.NODE_ENV !== "production" && url.protocol === "http:"
  if ((url.protocol !== "https:" && !developmentUrl) || url.username || url.password) {
    return { ok: false, message: "The attachment service returned an unsafe download URL.", status: 502 }
  }

  // Only redirect to the signed URL. The backend bearer token must never be
  // forwarded to storage, and signing happens afresh for every download.
  return { ok: true, data: { url } }
}
