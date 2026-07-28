import { cookies } from "next/headers"
import { z } from "zod"

import { createAuthApiUrl, getAuthConfig } from "@/lib/auth/config"
import { ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth/session-cookie"

const sessionResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string(),
    email: z.email(),
    name: z.string().nullable().optional(),
    role: z.string(),
  }),
})

export async function getCurrentSession() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value
  const config = getAuthConfig()

  if (!accessToken || !config) {
    return null
  }

  try {
    const response = await fetch(createAuthApiUrl(config, "auth/me"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      return null
    }

    const result = sessionResponseSchema.safeParse(await response.json())

    if (!result.success || result.data.data.role !== "ADMIN") {
      return null
    }

    return { ...result.data.data, role: "ADMIN" as const }
  } catch {
    return null
  }
}
