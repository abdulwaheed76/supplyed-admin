import Link from "next/link"
import { DownloadIcon, MessageSquareIcon } from "lucide-react"

import {
  formatAttachmentSize,
  formatConversationDate,
} from "@/lib/conversations/presentation"
import type { ConversationMessage } from "@/lib/conversations/schema"
import { cn } from "@/lib/utils"

function getDayLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date unavailable"

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

export function StaticConversationMessages({
  conversationId,
  messages,
}: {
  conversationId: string
  messages: ConversationMessage[]
}) {
  if (messages.length === 0) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed bg-background/70 px-4 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-muted">
          <MessageSquareIcon className="size-5 text-muted-foreground" aria-hidden="true" />
        </span>
        <h3 className="mt-3 font-medium">No messages yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">This conversation exists but has no messages.</p>
      </div>
    )
  }

  return (
    <ol className="space-y-3" aria-label="Complete conversation history">
      {messages.map((message, index) => {
        const senderKnown = Boolean(message.senderUserId && message.senderName && message.senderSide)
        const side = senderKnown ? message.senderSide : null
        const day = getDayLabel(message.createdAt)
        const previousDay = index > 0 ? getDayLabel(messages[index - 1].createdAt) : null
        const showDay = day !== previousDay

        return (
          <li key={message.id}>
            {showDay ? (
              <div className="my-5 flex items-center gap-3" aria-label={day}>
                <span className="h-px flex-1 bg-border" />
                <time className="rounded-full border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
                  {day}
                </time>
                <span className="h-px flex-1 bg-border" />
              </div>
            ) : null}

            <div className={cn(
              "flex min-w-0",
              side === "poster" ? "justify-end" : side === null ? "justify-center" : "justify-start"
            )}>
              <article className={cn(
                "min-w-0 max-w-[92%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[76%]",
                side === "instructor"
                  ? "rounded-tl-sm border bg-background"
                  : side === "poster"
                    ? "rounded-tr-sm bg-primary text-primary-foreground"
                    : "border border-dashed bg-background"
              )}>
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="text-sm font-semibold">
                    {senderKnown ? message.senderName : "Deleted user"}
                    {side ? (
                      <span className={cn(
                        "ml-2 text-[11px] font-normal",
                        side === "poster" ? "text-primary-foreground/75" : "text-muted-foreground"
                      )}>
                        {side === "instructor" ? "Instructor" : "Job poster"}
                      </span>
                    ) : null}
                  </p>
                  <time
                    dateTime={message.createdAt}
                    className={cn(
                      "text-[11px]",
                      side === "poster" ? "text-primary-foreground/75" : "text-muted-foreground"
                    )}
                  >
                    {formatConversationDate(message.createdAt)}
                  </time>
                </div>

                {message.body ? (
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">
                    {message.body}
                  </p>
                ) : null}

                {message.attachments.length > 0 ? (
                  <ul className="mt-3 space-y-2" aria-label="Attachments">
                    {message.attachments.map((attachment) => (
                      <li key={attachment.id}>
                        <Link
                          href={`/api/conversations/${encodeURIComponent(conversationId)}/attachments/${encodeURIComponent(attachment.id)}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          className={cn(
                            "flex min-w-0 items-center gap-3 rounded-xl border p-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                            side === "poster"
                              ? "border-primary-foreground/25 bg-primary-foreground/10 hover:bg-primary-foreground/15"
                              : "bg-muted/50 hover:bg-muted"
                          )}
                          aria-label={`Download ${attachment.fileName} (${formatAttachmentSize(attachment.sizeBytes)})`}
                        >
                          <span className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg",
                            side === "poster" ? "bg-primary-foreground/15" : "bg-background"
                          )}>
                            <DownloadIcon className="size-4" aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block break-words font-medium [overflow-wrap:anywhere]">{attachment.fileName}</span>
                            <span className={cn(
                              "text-xs",
                              side === "poster" ? "text-primary-foreground/75" : "text-muted-foreground"
                            )}>
                              {formatAttachmentSize(attachment.sizeBytes)}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
