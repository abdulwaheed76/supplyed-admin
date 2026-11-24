import { degreeCheckStatusSchema, type DegreeCheckStatus } from "@/lib/degree-checks/schema"

export type DegreeCheckFilters = {
  page: number
  limit: number
  status?: DegreeCheckStatus
  /** On unless turned off: the list opens on the checks waiting for an admin. */
  needsAction: boolean
}

type SearchParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim()
}

export function readDegreeCheckFilters(params: SearchParams): DegreeCheckFilters {
  const page = Number(first(params.page))
  const limit = Number(first(params.limit))
  const status = degreeCheckStatusSchema.safeParse(first(params.status))

  return {
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    limit: Number.isSafeInteger(limit) && limit >= 1 && limit <= 100 ? limit : 20,
    status: status.success ? status.data : undefined,
    needsAction: first(params.needsAction) !== "false",
  }
}

export function degreeChecksHref(filters: DegreeCheckFilters) {
  const params = new URLSearchParams()
  if (filters.status) params.set("status", filters.status)
  if (!filters.needsAction) params.set("needsAction", "false")
  if (filters.limit !== 20) params.set("limit", String(filters.limit))
  if (filters.page > 1) params.set("page", String(filters.page))
  const query = params.toString()
  return `/dashboard/degree-checks${query ? `?${query}` : ""}`
}
