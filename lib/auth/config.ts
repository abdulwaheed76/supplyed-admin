import { z } from "zod"

const authConfigSchema = z.object({
  apiBaseUrl: z.url(),
})

export type AuthConfig = z.infer<typeof authConfigSchema>

export function getAuthConfig(): AuthConfig | null {
  const result = authConfigSchema.safeParse({
    apiBaseUrl: process.env.API_BASE_URL ?? "http://localhost:3000/api",
  })

  return result.success ? result.data : null
}
