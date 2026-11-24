import {
  identityCheckOutcomeSchema,
  identityCheckStatusSchema,
  type IdentityCheckOutcome,
  type IdentityCheckStatus,
} from "@/lib/identity-checks/schema"

export type IdentityCheckFilters = {
  page: number
  limit: number
  status?: IdentityCheckStatus
  outcome?: IdentityCheckOutcome
  /** Only checks waiting for an admin to approve or reject them. */
  needsDecision?: boolean
  userId?: string
}

type SearchParams = Record<string, string | string[] | undefined>

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim()
}

export function readIdentityCheckFilters(params: SearchParams): IdentityCheckFilters {
  const page = Number(first(params.page))
  const limit = Number(first(params.limit))
  const status = identityCheckStatusSchema.safeParse(first(params.status))
  const outcome = identityCheckOutcomeSchema.safeParse(first(params.outcome))
  const userId = first(params.userId)

  return {
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    limit: Number.isSafeInteger(limit) && limit >= 1 && limit <= 100 ? limit : 20,
    status: status.success ? status.data : undefined,
    outcome: outcome.success ? outcome.data : undefined,
    needsDecision: first(params.needsDecision) === "true" ? true : undefined,
    // The backend rejects anything but a UUID, so a typo is dropped rather than failing the page.
    userId: userId && UUID_PATTERN.test(userId) ? userId : undefined,
  }
}

export function identityChecksHref(filters: IdentityCheckFilters) {
  const params = new URLSearchParams()
  if (filters.status) params.set("status", filters.status)
  if (filters.outcome) params.set("outcome", filters.outcome)
  if (filters.needsDecision) params.set("needsDecision", "true")
  if (filters.userId) params.set("userId", filters.userId)
  if (filters.limit !== 20) params.set("limit", String(filters.limit))
  if (filters.page > 1) params.set("page", String(filters.page))
  const query = params.toString()
  return `/dashboard/identity-checks${query ? `?${query}` : ""}`
}
