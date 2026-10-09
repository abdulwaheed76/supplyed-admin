import { Suspense } from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  CreditCardIcon,
  EyeIcon,
  MessageSquareIcon,
  MessagesSquareIcon,
} from "lucide-react"

import { ConversationThread } from "@/components/conversations/conversation-thread"
import { ConversationsSkeleton } from "@/components/conversations/conversations-skeleton"
import { RefreshConversations } from "@/components/conversations/refresh-conversations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getJobConversationArchive } from "@/lib/conversations/get-conversations"

type ConversationsPageProps = {
  params: Promise<{ id: string }>
}

function ErrorCard({ title, message, status }: { title: string; message: string; status: number }) {
  return (
    <Card role="alert" className="self-start">
      <CardHeader>
        <CardTitle>{status === 403 ? "Access denied" : status === 401 ? "Sign in required" : title}</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      {status === 401 ? <CardContent><Button asChild variant="outline"><Link href="/login">Sign in again</Link></Button></CardContent> : null}
    </Card>
  )
}

async function ConversationsContent({ params }: ConversationsPageProps) {
  const { id } = await params
  const result = await getJobConversationArchive(id)
  const totalMessages = result.ok
    ? result.data.threads.reduce(
        (total, thread) => total + (thread.messages.ok ? thread.messages.data.messages.length : 0),
        0
      )
    : 0

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild size="sm" variant="ghost" className="-ml-2"><Link href={`/dashboard/jobs/${encodeURIComponent(id)}`}><ArrowLeftIcon />Back to job</Link></Button>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href={`/dashboard/jobs/${encodeURIComponent(id)}/payments`}><CreditCardIcon />Payments</Link></Button>
          <RefreshConversations />
        </div>
      </div>
      <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/8 via-background to-background">
        <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <MessageSquareIcon className="size-4" aria-hidden="true" />
              Job chat
            </div>
            <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-3xl">
              {result.ok ? result.data.job.title : "Job conversations"}
            </h1>
            <p className="mt-2 flex max-w-2xl items-start gap-2 text-sm leading-6 text-muted-foreground">
              <EyeIcon className="mt-1 size-4 shrink-0" aria-hidden="true" />
              Complete read-only chat history. Viewing this page does not change either participant&apos;s read status.
            </p>
          </div>
          {result.ok ? (
            <div className="flex gap-3">
              <div className="min-w-28 rounded-xl border bg-background/80 px-4 py-3 shadow-sm">
                <p className="text-2xl font-semibold tabular-nums">{result.data.threads.length}</p>
                <p className="text-xs text-muted-foreground">Conversations</p>
              </div>
              <div className="min-w-28 rounded-xl border bg-background/80 px-4 py-3 shadow-sm">
                <p className="text-2xl font-semibold tabular-nums">{totalMessages}</p>
                <p className="text-xs text-muted-foreground">Messages</p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {!result.ok ? (
        <ErrorCard title="Unable to load conversations" {...result} />
      ) : result.data.threads.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
              <MessagesSquareIcon className="size-6 text-muted-foreground" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-semibold">No conversations yet</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Existing instructor and job poster conversations will appear here automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <section aria-label="All job conversations" className="space-y-6">
          {result.data.threads.map((thread, index) => (
            <ConversationThread
              key={thread.conversation.id}
              conversation={thread.conversation}
              messages={thread.messages}
              position={index + 1}
            />
          ))}
        </section>
      )}
    </div>
  )
}

export default function JobConversationsPage(props: ConversationsPageProps) {
  return <Suspense fallback={<ConversationsSkeleton />}><ConversationsContent {...props} /></Suspense>
}
