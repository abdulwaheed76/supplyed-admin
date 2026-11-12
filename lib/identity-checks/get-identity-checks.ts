import "server-only"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import type { IdentityCheckFilters } from "@/lib/identity-checks/filters"
import {
  paginatedIdentityChecksResponseSchema,
  type IdentityCheck,
  type IdentityChecksPagination,
} from "@/lib/identity-checks/schema"

export type GetIdentityChecksResult =
  | { ok: true; checks: IdentityCheck[]; pagination: IdentityChecksPagination }
  | { ok: false; message: string; status: number }

/** `GET /identity-verification/admin`: TrustID checks, newest first, with their results. */
export async function getIdentityChecks(
  filters: IdentityCheckFilters
): Promise<GetIdentityChecksResult> {
  const result = await adminApiRequest({
    path: "identity-verification/admin",
    searchParams: {
      page: filters.page,
      limit: filters.limit,
      status: filters.status,
      outcome: filters.outcome,
      needsDecision: filters.needsDecision ? "true" : undefined,
      userId: filters.userId,
    },
    schema: paginatedIdentityChecksResponseSchema,
    serviceName: "identity verification",
    fallbackMessage: "Unable to load identity checks.",
  })

  if (!result.ok) {
    return result
  }

  return {
    ok: true,
    checks: result.data.data.verifications,
    pagination: result.data.data.pagination,
  }
}
