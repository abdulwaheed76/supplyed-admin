import { z } from "zod"

export const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().nullable().optional(),
  fullName: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  role: z.string(),
  countryCode: z.string().nullable().optional(),
  profileStatus: z.string().nullable().optional(),
  emailVerified: z.boolean(),
  phoneVerified: z.boolean().optional(),
  phone: z.string().nullable().optional(),
  lastLogin: z.string().nullable().optional(),
  twoFactorEnabled: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type UserListItem = z.infer<typeof userSchema>
