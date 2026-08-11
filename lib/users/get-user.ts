import "server-only"

import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import { userSchema, type UserListItem } from "@/lib/users/schema"

type GetUserResult =
  | { ok: true; user: UserListItem }
  | { ok: false; message: string; status: number }

const userResponseSchema = z.object({
  success: z.literal(true),
  data: userSchema,
})

export async function getUser(userId: string): Promise<GetUserResult> {
  const normalizedUserId = userId.trim()

  if (!normalizedUserId || normalizedUserId.length > 128) {
    return { ok: false, message: "The user ID is invalid.", status: 400 }
  }

  const result = await adminApiRequest({
    path: `users/${encodeURIComponent(normalizedUserId)}`,
    schema: userResponseSchema,
    serviceName: "users",
    fallbackMessage: "Unable to load this user.",
  })

  if (!result.ok) {
    return result
  }

  return { ok: true, user: result.data.data }
}
