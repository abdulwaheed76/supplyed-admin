import Link from "next/link"
import {
  Building2Icon,
  GraduationCapIcon,
  MessageSquareTextIcon,
} from "lucide-react"

import { StaticConversationMessages } from "@/components/conversations/static-conversation-messages"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { AdminApiResult } from "@/lib/api/admin-api-client"
import { formatConversationDate, getConversationStatusLabel } from "@/lib/conversations/presentation"
import type { Conversation, MessagesPage } from "@/lib/conversations/schema"

export function ConversationThread({
  conversation,
  messages,
  position,
}: {
  conversation: Conversation
  messages: AdminApiResult<MessagesPage>
  position: number
}) {
  const participants = [
    {
      label: "Instructor",
      person: conversation.participants.instructor,
      readAt: conversation.instructorLastReadAt,
      Icon: GraduationCapIcon,
    },
    {
      label: "Job poster",
      person: conversation.participants.poster,
      readAt: conversation.posterLastReadAt,
      Icon: Building2Icon,
    },
  ]

  return (
    <Card id={`conversation-${conversation.id}`} className="min-w-0 overflow-hidden scroll-mt-20">
      <CardHeader className="border-b bg-gradient-to-br from-primary/7 via-background to-background">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <MessageSquareTextIcon className="size-3.5" aria-hidden="true" />
                Conversation {position}
              </span>
              <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
                {getConversationStatusLabel(conversation)}
              </span>
            </div>
            <CardTitle className="break-words text-xl [overflow-wrap:anywhere]">
              {conversation.participants.instructor.name}
              <span className="mx-2 font-normal text-muted-foreground">and</span>
              {conversation.participants.poster.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {messages.ok
                ? `${messages.data.messages.length.toLocaleString("en-GB")} message${messages.data.messages.length === 1 ? "" : "s"} · Complete history`
                : "Message history unavailable"}
            </CardDescription>
          </div>
          <p className="shrink-0 text-xs text-muted-foreground">
            Last activity<br />
            <span className="font-medium text-foreground">
              {formatConversationDate(conversation.lastMessageAt || conversation.createdAt)}
            </span>
          </p>
        </div>

        <div className="grid gap-3 pt-2 md:grid-cols-2">
          {participants.map(({ label, person, readAt, Icon }) => (
            <div key={label} className="flex min-w-0 items-start gap-3 rounded-xl border bg-background/85 p-3 shadow-sm">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                <Link
                  href={`/dashboard/users/${encodeURIComponent(person.userId)}`}
                  className="block break-words font-semibold underline-offset-4 hover:underline [overflow-wrap:anywhere]"
                >
                  {person.name}
                </Link>
                <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{person.userId}</p>
                <p className="mt-1 text-xs text-muted-foreground">Last read: {formatConversationDate(readAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="bg-muted/20 p-4 sm:p-6">
        {messages.ok ? (
          <StaticConversationMessages
            conversationId={conversation.id}
            messages={messages.data.messages}
          />
        ) : (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="font-medium text-destructive">Unable to load messages</p>
            <p className="mt-1 text-sm text-muted-foreground">{messages.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
