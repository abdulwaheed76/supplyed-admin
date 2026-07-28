import "server-only"

import { cookies } from "next/headers"
import { z } from "zod"

import { createAuthApiUrl, getAuthConfig, type AuthConfig } from "@/lib/auth/config"
import { ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth/session-cookie"
import type { UserListItem } from "@/lib/users/schema"

const instructorStatusSchema = z.object({
  userId: z.string(),
  status: z.string(),
})

const institutionStatusSchema = z.object({
  userId: z.string(),
  status: z.string(),
})

type ProfileStatusesResult =
  | { ok: true; statuses: Record<string, string> }
  | { ok: false; message: string }

async function fetchProfiles<T>(
  resource: string,
  schema: z.ZodType<T>,
  config: AuthConfig,
  accessToken: string
) {
  try {
    const response = await fetch(createAuthApiUrl(config, resource), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })
    const body: unknown = await response.json().catch(() => null)

    if (!response.ok) {
      return { ok: false as const }
    }

    const result = z
      .object({ success: z.literal(true), data: z.array(schema) })
      .safeParse(body)

    return result.success
      ? { ok: true as const, profiles: result.data.data }
      : { ok: false as const }
  } catch {
    return { ok: false as const }
  }
}

export async function getProfileStatuses(
  users: UserListItem[]
): Promise<ProfileStatusesResult> {
  const instructors = users.filter(
    (user) => user.role === "INSTRUCTOR" && !user.profileStatus
  )
  const institutions = users.filter(
    (user) => user.role === "INSTITUTION" && !user.profileStatus
  )

  if (instructors.length === 0 && institutions.length === 0) {
    return { ok: true, statuses: {} }
  }

  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value
  const config = getAuthConfig()

  if (!accessToken || !config) {
    return { ok: false, message: "Profile statuses are unavailable." }
  }

  const [instructorResult, institutionResult] = await Promise.all([
    instructors.length > 0
      ? fetchProfiles(
          "instructors",
          instructorStatusSchema,
          config,
          accessToken
        )
      : Promise.resolve({
          ok: true as const,
          profiles: [] as z.infer<typeof instructorStatusSchema>[],
        }),
    institutions.length > 0
      ? fetchProfiles(
          "institutions",
          institutionStatusSchema,
          config,
          accessToken
        )
      : Promise.resolve({
          ok: true as const,
          profiles: [] as z.infer<typeof institutionStatusSchema>[],
        }),
  ])

  if (!instructorResult.ok || !institutionResult.ok) {
    return { ok: false, message: "Profile statuses are unavailable." }
  }

  const statuses: Record<string, string> = {}

  for (const user of [...instructors, ...institutions]) {
    statuses[user.id] = "NOT_FOUND"
  }

  for (const profile of instructorResult.profiles) {
    statuses[profile.userId] = profile.status
  }

  for (const profile of institutionResult.profiles) {
    statuses[profile.userId] = profile.status
  }

  return { ok: true, statuses }
}
