import "server-only"

import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import type { UserListItem } from "@/lib/users/schema"

const profileStatusSchema = z.object({
  userId: z.string(),
  status: z.string(),
})

const paginationSchema = z.object({
  hasNextPage: z.boolean(),
})

type ProfileStatus = z.infer<typeof profileStatusSchema>

type ProfileStatusesResult =
  | { ok: true; statuses: Record<string, string> }
  | { ok: false; message: string }

async function fetchProfiles(resource: "instructors" | "institutions") {
  const profiles: ProfileStatus[] = []
  const schema = z.object({
    success: z.literal(true),
    data: z.union([
      z.array(profileStatusSchema).transform((items) => ({
        profiles: items,
        hasNextPage: false,
      })),
      z.object({
        [resource]: z.array(profileStatusSchema),
      }).and(z.object({ pagination: paginationSchema })).transform((data) => ({
        profiles: data[resource],
        hasNextPage: data.pagination.hasNextPage,
      })),
    ]),
  })

  for (let page = 1; ; page += 1) {
    const result = await adminApiRequest({
      path: resource,
      searchParams: { page, limit: 100 },
      schema,
      serviceName: resource,
    })

    if (!result.ok) {
      return { ok: false as const }
    }

    profiles.push(...result.data.data.profiles)

    if (!result.data.data.hasNextPage) {
      return { ok: true as const, profiles }
    }
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
