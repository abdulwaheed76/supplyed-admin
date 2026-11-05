import { routeRequest } from "@/lib/api/route-request"
import {
  submissionResponseSchema,
  type SubmissionStatus,
  type WaitingListSubmission,
} from "@/lib/waiting-list/schema"

export async function updateSubmissionStatus(
  id: string,
  status: SubmissionStatus
): Promise<WaitingListSubmission> {
  return routeRequest(
    `/api/contact/founding-interest/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: { status },
      schema: submissionResponseSchema,
      fallbackMessage: "Unable to update the submission status.",
    }
  )
}

export async function deleteSubmission(id: string): Promise<void> {
  await routeRequest(
    `/api/contact/founding-interest/${encodeURIComponent(id.slice(0, 128))}`,
    {
      method: "DELETE",
      fallbackMessage: "Unable to delete the submission.",
    }
  )
}
