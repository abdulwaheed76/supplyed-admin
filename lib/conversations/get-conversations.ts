import "server-only"

import { adminApiRequest, type AdminApiResult } from "@/lib/api/admin-api-client"
import {
  conversationIdSchema,
  conversationResponseSchema,
  jobConversationIdSchema,
  jobConversationsResponseSchema,
  messageCursorSchema,
  messagesResponseSchema,
  type Conversation,
  type JobConversations,
  type MessagesPage,
} from "@/lib/conversations/schema"
import { prependConversationMessages } from "@/lib/conversations/presentation"

export type JobConversationArchive = {
  job: JobConversations["job"]
  threads: Array<{
    conversation: Conversation
    messages: AdminApiResult<MessagesPage>
  }>
}

export async function getJobConversations(
  jobId: string,
  page = 1,
): Promise<AdminApiResult<JobConversations>> {
  const id = jobConversationIdSchema.safeParse(jobId.trim())
  if (!id.success || !Number.isSafeInteger(page) || page < 1) {
    return { ok: false, message: "The job ID or conversations page is invalid.", status: 400 }
  }

  const result = await adminApiRequest({
    path: `conversations/job/${encodeURIComponent(id.data)}`,
    searchParams: { page, limit: 20 },
    schema: jobConversationsResponseSchema,
    serviceName: "conversations",
    fallbackMessage: "Unable to load this job's conversations.",
  })
  if (!result.ok) return result

  const data = result.data.data
  if (data.job.id !== id.data || data.conversations.some((item) => item.job?.id !== id.data)) {
    return { ok: false, message: "The conversations service returned an invalid job response.", status: 502 }
  }

  return {
    ok: true,
    data: {
      ...data,
      conversations: [...new Map(data.conversations.map((item) => [item.id, item])).values()],
    },
  }
}

export async function getConversation(
  conversationId: string,
  jobId: string,
): Promise<AdminApiResult<Conversation>> {
  const id = conversationIdSchema.safeParse(conversationId)
  if (!id.success) {
    return { ok: false, message: "The conversation ID is invalid.", status: 400 }
  }

  const result = await adminApiRequest({
    path: `conversations/${encodeURIComponent(id.data)}`,
    schema: conversationResponseSchema,
    serviceName: "conversations",
    fallbackMessage: "Unable to load this conversation.",
  })
  if (!result.ok) return result

  if (result.data.data.id !== id.data || result.data.data.job?.id !== jobId) {
    return { ok: false, message: "This conversation does not belong to this job.", status: 404 }
  }

  return { ok: true, data: result.data.data }
}

export async function getConversationMessages(
  conversationId: string,
  before?: string,
): Promise<AdminApiResult<MessagesPage>> {
  const id = conversationIdSchema.safeParse(conversationId)
  if (!id.success || (before !== undefined && !messageCursorSchema.safeParse(before).success)) {
    return { ok: false, message: "The conversation or message cursor is invalid.", status: 400 }
  }

  const result = await adminApiRequest({
    path: `conversations/${encodeURIComponent(id.data)}/messages`,
    searchParams: { limit: 30, before },
    schema: messagesResponseSchema,
    serviceName: "conversations",
    fallbackMessage: "Unable to load the messages.",
  })
  if (!result.ok) return result

  if (result.data.data.messages.some((message) => message.conversationId !== id.data)) {
    return { ok: false, message: "The conversations service returned an invalid message response.", status: 502 }
  }

  return { ok: true, data: result.data.data }
}

export async function getAllConversationMessages(
  conversationId: string
): Promise<AdminApiResult<MessagesPage>> {
  let page = await getConversationMessages(conversationId)
  if (!page.ok) return page

  let messages = page.data.messages
  const usedCursors = new Set<string>()

  while (page.data.hasMore) {
    const cursor = messages[0]?.id
    if (!cursor || usedCursors.has(cursor)) {
      return {
        ok: false,
        status: 502,
        message: "The conversations service returned an invalid message history.",
      }
    }

    usedCursors.add(cursor)
    page = await getConversationMessages(conversationId, cursor)
    if (!page.ok) return page
    messages = prependConversationMessages(page.data.messages, messages)
  }

  return { ok: true, data: { messages, hasMore: false } }
}

export async function getJobConversationArchive(
  jobId: string
): Promise<AdminApiResult<JobConversationArchive>> {
  const first = await getJobConversations(jobId, 1)
  if (!first.ok) return first

  const conversations = [...first.data.conversations]

  // Load the remaining conversation pages in small batches so the complete
  // history appears automatically without flooding the backend.
  for (let page = 2; page <= first.data.pagination.totalPages; page += 4) {
    const pages = Array.from(
      { length: Math.min(4, first.data.pagination.totalPages - page + 1) },
      (_, index) => page + index
    )
    const results = await Promise.all(pages.map((number) => getJobConversations(jobId, number)))
    const failure = results.find((result) => !result.ok)
    if (failure && !failure.ok) return failure

    for (const result of results) {
      if (result.ok) conversations.push(...result.data.conversations)
    }
  }

  const uniqueConversations = [
    ...new Map(conversations.map((conversation) => [conversation.id, conversation])).values(),
  ]
  const threads: JobConversationArchive["threads"] = []

  // Message pages must be read sequentially within a thread because the oldest
  // returned message is the next cursor. Separate threads can load in parallel.
  for (let offset = 0; offset < uniqueConversations.length; offset += 4) {
    const batch = uniqueConversations.slice(offset, offset + 4)
    const messages = await Promise.all(
      batch.map((conversation) => getAllConversationMessages(conversation.id))
    )

    threads.push(
      ...batch.map((conversation, index) => ({
        conversation,
        messages: messages[index],
      }))
    )
  }

  return {
    ok: true,
    data: { job: first.data.job, threads },
  }
}
