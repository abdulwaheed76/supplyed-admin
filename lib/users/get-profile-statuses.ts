import "server-only"

import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import type { UserListItem } from "@/lib/users/schema"

const profileStatusResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(
    z.object({
      userId: z.string(),
      status: z.string(),
    })
  ),
})

type ProfileStatus = z.infer<
  typeof profileStatusResponseSchema
>["data"][number]

type ProfileStatusesResult =
  | { ok: true; statuses: Record<string, string> }
  | { ok: false; message: string }

async function fetchProfiles(resource: "instructors" | "institutions") {
  const result = await adminApiRequest({
    path: resource,
    schema: profileStatusResponseSchema,
    serviceName: resource,
  })

  return result.ok
    ? { ok: true as const, profiles: result.data.data }
    : { ok: false as const }
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

  const empty = Promise.resolve({
    ok: true as const,
    profiles: [] as ProfileStatus[],
  })

  const [instructorResult, institutionResult] = await Promise.all([
    instructors.length > 0 ? fetchProfiles("instructors") : empty,
    institutions.length > 0 ? fetchProfiles("institutions") : empty,
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
