import "server-only"

import { cookies } from "next/headers"
import { z } from "zod"

import { createAuthApiUrl, getAuthConfig } from "@/lib/auth/config"
import { ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth/session-cookie"
import type { UserListItem } from "@/lib/users/schema"

const instructorProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  fullName: z.string(),
  imageUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  skills: z.array(z.string()),
  subjects: z.array(z.string()),
  keyStages: z.array(z.string()),
  hourlyRate: z.number().nullable().optional(),
  dailyRate: z.number().nullable().optional(),
  experience: z.number().int().nullable().optional(),
  currency: z.string().nullable().optional(),
  maxTravelDistance: z.number().nullable().optional(),
  ratingAverage: z.number(),
  ratingCount: z.number().int().nonnegative(),
  dbsVerified: z.boolean(),
  status: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

const institutionProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  imageUrl: z.string().nullable().optional(),
  registrationId: z.string().nullable().optional(),
  domain: z.string(),
  address: z.string(),
  city: z.string(),
  county: z.string(),
  postalCode: z.string().nullable().optional(),
  countryCode: z.string(),
  staffingNeeds: z.string().nullable().optional(),
  userRole: z.string().nullable().optional(),
  verified: z.boolean(),
  subscriptionTier: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

const errorResponseSchema = z.object({
  message: z.union([z.string(), z.array(z.string())]),
})

export type InstructorProfile = z.infer<typeof instructorProfileSchema>
export type InstitutionProfile = z.infer<typeof institutionProfileSchema>

export type RoleProfileResult =
  | { ok: true; kind: "instructor"; profile: InstructorProfile | null }
  | { ok: true; kind: "institution"; profile: InstitutionProfile | null }
  | { ok: true; kind: "none"; profile: null }
  | { ok: false; message: string; status: number }

function getErrorMessage(body: unknown, fallback: string) {
  const error = errorResponseSchema.safeParse(body)

  if (!error.success) {
    return fallback
  }

  return Array.isArray(error.data.message)
    ? error.data.message.join(" ")
    : error.data.message
}

export async function getRoleProfile(
  user: UserListItem
): Promise<RoleProfileResult> {
  const isInstructor = user.role === "INSTRUCTOR"
  const isInstitution = user.role === "INSTITUTION"

  if (!isInstructor && !isInstitution) {
    return { ok: true, kind: "none", profile: null }
  }

  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value
  const config = getAuthConfig()

  if (!accessToken) {
    return {
      ok: false,
      message: "Your session has expired. Sign in again.",
      status: 401,
    }
  }

  if (!config) {
    return {
      ok: false,
      message: "The backend API URL is not configured.",
      status: 503,
    }
  }

  const resource = isInstructor ? "instructors" : "institutions"
  let response: Response

  try {
    response = await fetch(createAuthApiUrl(config, resource), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })
  } catch {
    return {
      ok: false,
      message: `The ${resource} service is unavailable.`,
      status: 503,
    }
  }

  const body: unknown = await response.json().catch(() => null)

  if (process.env.NODE_ENV !== "production") {
    console.info(`[${resource}-api] Response`, {
      status: response.status,
      ok: response.ok,
      userId: "[REDACTED]",
    })
  }

  if (!response.ok) {
    return {
      ok: false,
      message: getErrorMessage(body, `Unable to load ${resource}.`),
      status: response.status,
    }
  }

  const schema = z.object({
    success: z.literal(true),
    data: z.array(
      isInstructor ? instructorProfileSchema : institutionProfileSchema
    ),
  })
  const result = schema.safeParse(body)

  if (!result.success) {
    return {
      ok: false,
      message: `The ${resource} service returned an invalid response.`,
      status: 502,
    }
  }

  if (isInstructor) {
    const profiles = result.data.data as InstructorProfile[]

    return {
      ok: true,
      kind: "instructor",
      profile: profiles.find((profile) => profile.userId === user.id) ?? null,
    }
  }

  const profiles = result.data.data as InstitutionProfile[]

  return {
    ok: true,
    kind: "institution",
    profile: profiles.find((profile) => profile.userId === user.id) ?? null,
  }
}
