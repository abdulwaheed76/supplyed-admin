import "server-only"

import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import { profileStatusSchema } from "@/lib/users/profile-status-schema"
import type { UserListItem } from "@/lib/users/schema"

const instructorProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  fullName: z.string(),
  countryCode: z.string().nullable().optional(),
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
  status: profileStatusSchema,
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
  county: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  countryCode: z.string(),
  staffingNeeds: z.array(z.string()),
  coverTypes: z.array(z.string()),
  typicalPupilCount: z.number().int().nonnegative().nullable().optional(),
  complianceContact: z.string().nullable().optional(),
  complianceEmail: z.email().nullable().optional(),
  safeguardingConfirmed: z.boolean(),
  userRole: z.string().nullable().optional(),
  verified: z.boolean(),
  subscriptionTier: z.string().nullable().optional(),
  status: profileStatusSchema,
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

const recruiterProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  displayName: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  county: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  status: profileStatusSchema,
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

const recruitersResponseSchema = z.object({
  success: z.literal(true),
  data: z.union([
    z.array(recruiterProfileSchema),
    z.object({ recruiters: z.array(recruiterProfileSchema) }),
  ]),
})

export type InstructorProfile = z.infer<typeof instructorProfileSchema>
export type InstitutionProfile = z.infer<typeof institutionProfileSchema>
export type RecruiterProfile = z.infer<typeof recruiterProfileSchema>

export type RoleProfileResult =
  | { ok: true; kind: "instructor"; profile: InstructorProfile | null }
  | { ok: true; kind: "institution"; profile: InstitutionProfile | null }
  | { ok: true; kind: "recruiter"; profile: RecruiterProfile | null }
  | { ok: true; kind: "none"; profile: null }
  | { ok: false; message: string; status: number }

export function withRoleProfileName(
  user: UserListItem,
  result: RoleProfileResult
): UserListItem {
  if (!result.ok || result.kind === "none" || !result.profile) return user

  const profileName =
    result.kind === "instructor"
      ? result.profile.fullName
      : result.kind === "institution"
        ? result.profile.name
        : result.profile.displayName

  return { ...user, displayName: user.displayName?.trim() || profileName }
}

export async function getRoleProfile(
  user: UserListItem
): Promise<RoleProfileResult> {
  const isInstructor = user.role === "INSTRUCTOR"
  const isInstitution = user.role === "INSTITUTION"
  const isRecruiter = user.role === "RECRUITER"

  if (!isInstructor && !isInstitution && !isRecruiter) {
    return { ok: true, kind: "none", profile: null }
  }

  if (isInstructor) {
    const result = await adminApiRequest({
      path: "instructors",
      searchParams: { userId: user.id },
      schema: z.object({
        success: z.literal(true),
        data: z.union([
          z.array(instructorProfileSchema),
          z.object({ instructors: z.array(instructorProfileSchema) }),
        ]),
      }),
      serviceName: "instructors",
      fallbackMessage: "Unable to load instructors.",
      debugLabel: "instructors-api",
    })

    if (!result.ok) {
      return result
    }

    return {
      ok: true,
      kind: "instructor",
      profile:
        (Array.isArray(result.data.data)
          ? result.data.data
          : result.data.data.instructors
        ).find((profile) => profile.userId === user.id) ?? null,
    }
  }

  if (isInstitution) {
    const result = await adminApiRequest({
      path: "institutions",
      searchParams: { userId: user.id },
      schema: z.object({
        success: z.literal(true),
        data: z.union([
          z.array(institutionProfileSchema),
          z.object({ institutions: z.array(institutionProfileSchema) }),
        ]),
      }),
      serviceName: "institutions",
      fallbackMessage: "Unable to load institutions.",
      debugLabel: "institutions-api",
    })

    if (!result.ok) {
      return result
    }

    return {
      ok: true,
      kind: "institution",
      profile:
        (Array.isArray(result.data.data)
          ? result.data.data
          : result.data.data.institutions
        ).find((profile) => profile.userId === user.id) ?? null,
    }
  }

  const result = await adminApiRequest({
    path: "recruiters",
    schema: recruitersResponseSchema,
    serviceName: "recruiters",
    fallbackMessage: "Unable to load recruiters.",
    debugLabel: "recruiters-api",
  })

  if (!result.ok) {
    return result
  }

  return {
    ok: true,
    kind: "recruiter",
    profile:
      (Array.isArray(result.data.data)
        ? result.data.data
        : result.data.data.recruiters
      ).find((profile) => profile.userId === user.id) ?? null,
  }
}

