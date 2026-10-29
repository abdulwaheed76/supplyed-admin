import type { Conversation, ConversationMessage } from "@/lib/conversations/schema"

export function getConversationStatusLabel(conversation: Pick<Conversation, "applicationStatus" | "booking" | "job">) {
  const status = conversation.applicationStatus ?? conversation.booking?.status
  if (!status) return conversation.job ? "Job conversation" : "General conversation"
  return status.toLowerCase().split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
}

export function formatConversationDate(value: string | null) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "Not recorded"

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value))
}

export function formatAttachmentSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function prependConversationMessages(
  older: ConversationMessage[],
  current: ConversationMessage[],
) {
  // The backend returns each cursor page oldest first. Preserve that order,
  // with the current copy winning when pages overlap during new activity.
  return [...new Map([...older, ...current].map((message) => [message.id, message])).values()]
}

export function getConversationHref(jobId: string, page = 1, conversationId?: string) {
  const params = new URLSearchParams()
  if (page > 1) params.set("page", String(page))
  if (conversationId) params.set("conversation", conversationId)
  const query = params.toString()
  return `/dashboard/jobs/${encodeURIComponent(jobId)}/conversations${query ? `?${query}` : ""}`
}
