import { z } from "zod"

import { routeRequest } from "@/lib/api/route-request"
import { userSchema, type UserListItem } from "@/lib/users/schema"
import type { CreateUserRole, UserRole } from "@/lib/users/roles"

const updateUserResponseSchema = z.object({
  user: userSchema,
})

export type UpdateUserInput = {
  name?: string
  phone?: string
  role?: UserRole
  emailVerified?: boolean
  phoneVerified?: boolean
}

export type CreateUserInput = {
  role: CreateUserRole
  email: string
  password: string
  name?: string
  phone?: string
  emailVerified: boolean
  phoneVerified: boolean
}

export async function createUser(input: CreateUserInput): Promise<UserListItem> {
  const result = await routeRequest("/api/users", {
    body: input,
    schema: updateUserResponseSchema,
    fallbackMessage: "Unable to create the user.",
  })
  return result.user
}

export async function deleteUser(id: string): Promise<void> {
  await routeRequest(`/api/users/${encodeURIComponent(id.slice(0, 128))}`, {
    method: "DELETE",
    fallbackMessage: "Unable to delete the user.",
  })
}

export async function updateUser({
  id,
  input,
}: {
  id: string
  input: UpdateUserInput
}): Promise<UserListItem> {
  const result = await routeRequest(
    `/api/users/${encodeURIComponent(id.slice(0, 128))}`,
    {
      method: "PATCH",
      body: input,
      schema: updateUserResponseSchema,
      fallbackMessage: "Unable to update the user.",
    }
  )

  return result.user
}
export async function disableUserTwoFactor(id: string): Promise<void> {
  await routeRequest('/api/users/' + encodeURIComponent(id.slice(0, 128)) + '/two-factor/disable', {
    method: 'POST',
    fallbackMessage: 'Unable to disable two-factor authentication.',
  })
}
