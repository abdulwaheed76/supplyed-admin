import { z } from "zod"

const authConfigSchema = z.object({
  apiBaseUrl: z.url(),
})

export type AuthConfig = z.infer<typeof authConfigSchema>

export function createAuthApiUrl(config: AuthConfig, path: string): URL {
  const baseUrl = config.apiBaseUrl.endsWith("/")
    ? config.apiBaseUrl
    : `${config.apiBaseUrl}/`

  return new URL(path.replace(/^\/+/, ""), baseUrl)
}

export function getAuthConfig(): AuthConfig | null {
  const result = authConfigSchema.safeParse({
    apiBaseUrl: process.env.API_BASE_URL,
  })

  return result.success ? result.data : null
}
