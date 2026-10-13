import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon, MessageSquareIcon, PaperclipIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatConversationDate, getConversationHref } from "@/lib/conversations/presentation"
import type { JobConversations } from "@/lib/conversations/schema"
import { cn } from "@/lib/utils"

export function ConversationList({ data, selectedId }: { data: JobConversations; selectedId?: string }) {
  const { job, conversations, pagination } = data

  return (
    <Card className="min-w-0 self-start">
      <CardHeader className="border-b">
        <CardTitle>Conversations</CardTitle>
        <CardDescription>{pagination.total.toLocaleString()} existing {pagination.total === 1 ? "conversation" : "conversations"} for this job</CardDescription>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <div className="py-8 text-center">
            <MessageSquareIcon className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
            <h2 className="mt-3 font-medium">{pagination.page > 1 ? "No conversations on this page" : "No conversations yet"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{pagination.page > 1 ? "Return to the first page to see the latest conversations." : "Existing instructor and job poster chats will appear here."}</p>
            {pagination.page > 1 ? <Link href={getConversationHref(job.id)} className="mt-3 inline-block text-sm underline underline-offset-4">Go to first page</Link> : null}
          </div>
        ) : (
          <nav aria-label="Job conversations" className="space-y-2">
            {conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={getConversationHref(job.id, pagination.page, conversation.id)}
                scroll={false}
                aria-current={selectedId === conversation.id ? "page" : undefined}
                className={cn(
                  "block min-w-0 space-y-2 rounded-xl border p-3 transition-colors hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-ring",
                  selectedId === conversation.id ? "border-primary/35 bg-primary/5" : "border-transparent bg-muted/30",
                )}
              >
                <div className="space-y-1">
                  <p className="break-words font-semibold [overflow-wrap:anywhere]">{conversation.participants.instructor.name}</p>
                  <p className="break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">with {conversation.participants.poster.name}</p>
                </div>
                <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">{conversation.applicationStatus.replaceAll("_", " ").toLowerCase()}</span>
                {conversation.lastMessage ? (
                  <p className="line-clamp-2 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
                    <span className="font-medium">{conversation.lastMessage.senderUserId && conversation.lastMessage.senderName ? conversation.lastMessage.senderName : "Deleted user"}: </span>
                    {conversation.lastMessage.body || (conversation.lastMessage.hasAttachments ? "Attachment" : "Empty message")}
                    {conversation.lastMessage.hasAttachments ? <PaperclipIcon className="ml-1 inline size-3" aria-label="Has attachments" /> : null}
                  </p>
                ) : <p className="text-xs text-muted-foreground">No messages yet</p>}
                <p className="text-[11px] text-muted-foreground">{formatConversationDate(conversation.lastMessageAt || conversation.createdAt)}</p>
              </Link>
            ))}
          </nav>
        )}
      </CardContent>
      <CardFooter className="flex-wrap justify-between gap-2">
        <p className="text-xs text-muted-foreground">Page {pagination.page} of {Math.max(1, pagination.totalPages)}</p>
        <div className="flex gap-1">
          {pagination.page > 1 ? (
            <Button asChild size="icon-sm" variant="outline"><Link href={getConversationHref(job.id, pagination.page - 1)} aria-label="Previous conversations page"><ChevronLeftIcon /></Link></Button>
          ) : <Button size="icon-sm" variant="outline" disabled aria-label="Previous conversations page"><ChevronLeftIcon /></Button>}
          {pagination.hasNextPage ? (
            <Button asChild size="icon-sm" variant="outline"><Link href={getConversationHref(job.id, pagination.page + 1)} aria-label="Next conversations page"><ChevronRightIcon /></Link></Button>
          ) : <Button size="icon-sm" variant="outline" disabled aria-label="Next conversations page"><ChevronRightIcon /></Button>}
        </div>
      </CardFooter>
    </Card>
  )
}
