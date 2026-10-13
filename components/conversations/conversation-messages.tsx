"use client"

import { useEffect, useRef, useState } from "react"
import { DownloadIcon, HistoryIcon, LoaderCircleIcon, MessageSquareIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  formatAttachmentSize,
  formatConversationDate,
  prependConversationMessages,
} from "@/lib/conversations/presentation"
import { messagesPageSchema, type MessagesPage } from "@/lib/conversations/schema"
import { cn } from "@/lib/utils"

export function ConversationMessages({
  conversationId,
  initialPage,
}: {
  conversationId: string
  initialPage: MessagesPage
}) {
  const [page, setPage] = useState(initialPage)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestRef = useRef<AbortController | null>(null)
  useEffect(() => () => requestRef.current?.abort(), [])

  async function loadOlder() {
    const firstMessage = page.messages[0]
    if (!firstMessage || requestRef.current) return

    const controller = new AbortController()
    requestRef.current = controller
    setPending(true)
    setError(null)

    try {
      const query = new URLSearchParams({ before: firstMessage.id })
      const response = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/messages?${query}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      })
      const body: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        const message = body && typeof body === "object" && "message" in body && typeof body.message === "string"
          ? body.message
          : "Unable to load older messages."
        throw new Error(message)
      }

      const parsed = messagesPageSchema.safeParse(body)
      if (!parsed.success || parsed.data.messages.some((message) => message.conversationId !== conversationId)) {
        throw new Error("The messages response could not be read.")
      }

      if (!controller.signal.aborted) {
        setPage((current) => ({
          messages: prependConversationMessages(parsed.data.messages, current.messages),
          hasMore: parsed.data.hasMore && parsed.data.messages.length > 0,
        }))
      }
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(failure instanceof Error ? failure.message : "Unable to load older messages.")
      }
    } finally {
      if (!controller.signal.aborted) {
        requestRef.current = null
        setPending(false)
      }
    }
  }

  return (
    <div className="space-y-5">
      {page.hasMore && page.messages.length > 0 ? (
        <div className="space-y-2 text-center">
          <Button variant="outline" onClick={loadOlder} disabled={pending}>
            {pending ? <LoaderCircleIcon className="animate-spin" /> : <HistoryIcon />}
            {pending ? "Loading older messages..." : "Load older messages"}
          </Button>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        </div>
      ) : null}

      {page.messages.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center text-center">
          <MessageSquareIcon className="size-8 text-muted-foreground" aria-hidden="true" />
          <h3 className="mt-3 font-medium">No messages yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">This conversation has no messages.</p>
        </div>
      ) : (
        <ol className="space-y-4" aria-label="Conversation messages" aria-busy={pending}>
          {page.messages.map((message) => {
            const senderKnown = Boolean(message.senderUserId && message.senderName && message.senderSide)
            const side = senderKnown ? message.senderSide : null

            return (
              <li key={message.id} className={cn("flex min-w-0", side === "poster" ? "justify-end" : side === null ? "justify-center" : "justify-start")}>
                <article className={cn(
                  "min-w-0 max-w-[95%] rounded-xl border p-4 sm:max-w-[88%]",
                  side === "instructor" ? "bg-muted/50" : side === "poster" ? "border-primary/15 bg-primary/5" : "border-dashed bg-background",
                )}>
                  <div className="mb-3 space-y-1">
                    <p className="break-words text-sm font-semibold [overflow-wrap:anywhere]">
                      {senderKnown ? message.senderName : "Deleted user"}
                      {side ? <span className="ml-2 text-xs font-normal text-muted-foreground">{side === "instructor" ? "Instructor" : "Job poster"}</span> : null}
                    </p>
                    {message.senderUserId ? <p className="break-all font-mono text-[11px] text-muted-foreground">User ID: {message.senderUserId}</p> : null}
                    <time dateTime={message.createdAt} className="block text-xs text-muted-foreground">{formatConversationDate(message.createdAt)}</time>
                  </div>

                  {message.body ? <p className="whitespace-pre-wrap break-words text-sm leading-relaxed [overflow-wrap:anywhere]">{message.body}</p> : null}

                  {message.attachments.length > 0 ? (
                    <ul className="mt-3 space-y-2" aria-label="Attachments">
                      {message.attachments.map((attachment) => (
                        <li key={attachment.id}>
                          <a
                            href={`/api/conversations/${encodeURIComponent(conversationId)}/attachments/${encodeURIComponent(attachment.id)}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            referrerPolicy="no-referrer"
                            className="flex min-w-0 items-center gap-3 rounded-lg border bg-background p-3 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                            aria-label={`Download ${attachment.fileName} (${formatAttachmentSize(attachment.sizeBytes)})`}
                          >
                            <DownloadIcon className="size-4 shrink-0" aria-hidden="true" />
                            <span className="min-w-0">
                              <span className="block break-words font-medium [overflow-wrap:anywhere]">{attachment.fileName}</span>
                              <span className="text-xs text-muted-foreground">{formatAttachmentSize(attachment.sizeBytes)}</span>
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              </li>
            )
          })}
        </ol>
      )}
      <p className="border-t pt-4 text-center text-xs text-muted-foreground">Read-only conversation history. Times shown in UTC.</p>
    </div>
  )
}
