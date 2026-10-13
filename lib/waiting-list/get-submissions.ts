import "server-only"

import {
  adminApiRequest,
  type AdminApiFailure,
} from "@/lib/api/admin-api-client"
import {
  allSubmissionsResponseSchema,
  submissionsResponseSchema,
  type SubmissionStatus,
  type SubmissionType,
  type WaitingListPagination,
  type WaitingListSubmission,
} from "@/lib/waiting-list/schema"

export type GetSubmissionsOptions = {
  page: number
  limit: number
  type?: SubmissionType
  status?: SubmissionStatus
  search?: string
  fromDate?: string
  toDate?: string
}

export type GetSubmissionsResult =
  | {
      ok: true
      submissions: WaitingListSubmission[]
      pagination: WaitingListPagination
    }
  | AdminApiFailure

export async function getSubmissions(
  options: GetSubmissionsOptions
): Promise<GetSubmissionsResult> {
  const result = await adminApiRequest({
    path: "contact/founding-interest",
    searchParams: options,
    schema: submissionsResponseSchema,
    serviceName: "waiting list",
    fallbackMessage: "Unable to load waiting list submissions.",
  })

  if (!result.ok) {
    return result
  }

  return { ok: true, ...result.data }
}

export async function getAllSubmissions(): Promise<
  | { ok: true; submissions: WaitingListSubmission[] }
  | AdminApiFailure
> {
  const result = await adminApiRequest({
    path: "contact/founding-interest/all",
    schema: allSubmissionsResponseSchema,
    serviceName: "waiting list",
    fallbackMessage: "Unable to load all waiting list submissions.",
  })

  if (!result.ok) return result

  return { ok: true, submissions: result.data.submissions }
}
