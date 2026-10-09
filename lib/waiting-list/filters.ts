import {
  submissionStatusSchema,
  submissionTypeSchema,
  type SubmissionStatus,
  type SubmissionType,
} from "@/lib/waiting-list/schema"

export type WaitingListFilters = {
  page: number
  limit: number
  type?: SubmissionType
  status?: SubmissionStatus
  search?: string
  fromDate?: string
  toDate?: string
}

type SearchParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim()
}

function dateInput(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined

  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
    ? value
    : undefined
}

export function readWaitingListFilters(params: SearchParams): WaitingListFilters {
  const page = Number(first(params.page))
  const limit = Number(first(params.limit))
  const type = submissionTypeSchema.safeParse(first(params.type))
  const status = submissionStatusSchema.safeParse(first(params.status))

  return {
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    limit: Number.isSafeInteger(limit) && limit >= 1 && limit <= 100 ? limit : 20,
    type: type.success ? type.data : undefined,
    status: status.success ? status.data : undefined,
    search: first(params.search) || undefined,
    fromDate: dateInput(first(params.fromDate)),
    toDate: dateInput(first(params.toDate)),
  }
}

export function waitingListHref(filters: WaitingListFilters) {
  const params = new URLSearchParams()
  if (filters.search) params.set("search", filters.search)
  if (filters.type) params.set("type", filters.type)
  if (filters.status) params.set("status", filters.status)
  if (filters.fromDate) params.set("fromDate", filters.fromDate)
  if (filters.toDate) params.set("toDate", filters.toDate)
  if (filters.limit !== 20) params.set("limit", String(filters.limit))
  if (filters.page > 1) params.set("page", String(filters.page))
  const query = params.toString()
  return `/dashboard/waiting-list${query ? `?${query}` : ""}`
}
