import { z } from "zod"

const recordIdSchema = z.string().trim().min(1).max(128)

export const conversationIdSchema = recordIdSchema
export const jobConversationIdSchema = z.uuid({ version: "v4" })
export const messageCursorSchema = z.uuid()

const conversationPartySchema = z.object({
  id: recordIdSchema.nullable(),
  userId: recordIdSchema,
  name: z.string(),
  imageUrl: z.string().nullable().optional(),
  role: z.enum(["teacher", "school"]),
})

export const conversationSchema = z.object({
  id: recordIdSchema,
  applicationId: recordIdSchema.nullable(),
  applicationStatus: z.string().nullable(),
  booking: z.object({ id: recordIdSchema, status: z.string(), applicationId: recordIdSchema }).nullable().optional(),
  readOnly: z.boolean(),
  job: z.object({ id: recordIdSchema, title: z.string() }).nullable(),
  participants: z.object({
    instructor: conversationPartySchema,
    poster: conversationPartySchema,
  }),
  instructorLastReadAt: z.string().nullable(),
  posterLastReadAt: z.string().nullable(),
  lastMessage: z.object({
    senderUserId: recordIdSchema.nullable(),
    senderName: z.string().nullable(),
    body: z.string(),
    hasAttachments: z.boolean(),
    createdAt: z.string(),
  }).nullable(),
  lastMessageAt: z.string().nullable(),
  createdAt: z.string(),
})

export const jobConversationsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    job: z.object({ id: recordIdSchema, title: z.string() }),
    conversations: z.array(conversationSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
      hasNextPage: z.boolean(),
    }),
  }),
})

export const conversationResponseSchema = z.object({
  success: z.literal(true),
  data: conversationSchema,
})

export const conversationMessageSchema = z.object({
  id: recordIdSchema,
  conversationId: recordIdSchema,
  senderUserId: recordIdSchema.nullable(),
  senderName: z.string().nullable(),
  senderSide: z.enum(["instructor", "poster"]).nullable(),
  body: z.string(),
  attachments: z.array(z.object({
    id: recordIdSchema,
    fileName: z.string(),
    contentType: z.string(),
    sizeBytes: z.number().int().nonnegative(),
  })),
  createdAt: z.string(),
})

export const messagesPageSchema = z.object({
  messages: z.array(conversationMessageSchema),
  hasMore: z.boolean(),
})

export const messagesResponseSchema = z.object({
  success: z.literal(true),
  data: messagesPageSchema,
})

export const attachmentDownloadResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ url: z.url(), expiresAt: z.string() }),
})

export type Conversation = z.infer<typeof conversationSchema>
export type ConversationMessage = z.infer<typeof conversationMessageSchema>
export type MessagesPage = z.infer<typeof messagesPageSchema>
export type JobConversations = z.infer<typeof jobConversationsResponseSchema>["data"]
