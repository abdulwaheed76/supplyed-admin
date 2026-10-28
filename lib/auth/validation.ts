import { z } from "zod"

export const loginSchema = z.object({
  email: z.email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).refine((value) => new TextEncoder().encode(value).length <= 72),
})

export type LoginInput = z.infer<typeof loginSchema>
