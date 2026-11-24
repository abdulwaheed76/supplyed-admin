import "server-only"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import type { DegreeCheckFilters } from "@/lib/degree-checks/filters"
import {
  degreeCheckResponseSchema,
  paginatedDegreeChecksResponseSchema,
  type DegreeCheck,
} from "@/lib/degree-checks/schema"
import type { IdentityChecksPagination } from "@/lib/identity-checks/schema"

type Failure = { ok: false; message: string; status: number }

/** `GET /degree-checks/admin`: Hedd degree checks, newest first. */
export async function getDegreeChecks(
  filters: DegreeCheckFilters
): Promise<{ ok: true; checks: DegreeCheck[]; pagination: IdentityChecksPagination } | Failure> {
  const result = await adminApiRequest({
    path: "degree-checks/admin",
    searchParams: {
      page: filters.page,
      limit: filters.limit,
      status: filters.status,
      needsAction: filters.needsAction ? "true" : undefined,
    },
    schema: paginatedDegreeChecksResponseSchema,
    serviceName: "degree checks",
    fallbackMessage: "Unable to load degree checks.",
  })

  if (!result.ok) {
    return result
  }

  return { ok: true, checks: result.data.data.degreeChecks, pagination: result.data.data.pagination }
}

/** The teacher's latest degree check, or null if they never started one. */
export async function getLatestDegreeCheckForUser(
  userId: string
): Promise<{ ok: true; check: DegreeCheck | null } | Failure> {
  const result = await adminApiRequest({
    path: "degree-checks/admin",
    searchParams: { userId, limit: 1 },
    schema: paginatedDegreeChecksResponseSchema,
    serviceName: "degree checks",
    fallbackMessage: "Unable to load the degree check.",
  })

  if (!result.ok) {
    return result
  }

  return { ok: true, check: result.data.data.degreeChecks[0] ?? null }
}

export async function getDegreeCheck(id: string): Promise<{ ok: true; check: DegreeCheck } | Failure> {
  const normalizedId = id.trim()

  if (!normalizedId || normalizedId.length > 128) {
    return { ok: false, message: "The degree check ID is invalid.", status: 400 }
  }

  const result = await adminApiRequest({
    path: `degree-checks/admin/${encodeURIComponent(normalizedId)}`,
    schema: degreeCheckResponseSchema,
    serviceName: "degree checks",
    fallbackMessage: "Unable to load this degree check.",
  })

  if (!result.ok) {
    return result
  }

  return { ok: true, check: result.data.data }
}
